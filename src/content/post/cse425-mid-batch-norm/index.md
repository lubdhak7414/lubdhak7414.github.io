---
title: "Batch normalisation by hand: training and test time"
description: "Batch norm worked by hand on 2, 4, 6, 8: mean, variance, scale and shift, the gradients for gamma and beta, and what changes at test time with running averages."
publishDate: '2026-11-02'
tags: [neural-networks, cse425, batch-norm, normalization]
series: "CSE 425"
section: "Mid"
part: 6
---

Suppose a layer hands the next one numbers like 80 and 90. A sigmoid squeezes both to almost exactly 1, so its slope there is nearly zero, and a slope of zero means the weights below it stop learning. Batch normalisation recentres the numbers so that, across a batch, they have mean 0 and spread 1, which is the region where a sigmoid still has a useful slope.

Big numbers are one version of the problem. Another is that the numbers a layer receives keep drifting as the layers before it change during training, so each layer is aiming at a target that moves. The original paper calls this internal covariate shift. Later work ([Santurkar and colleagues](https://arxiv.org/abs/1805.11604)) argues that the smoother loss surface matters more than the drift. Either way, keeping each layer's inputs on a steady scale lets you use larger learning rates.

> **Key Takeaways**
> - Batch norm takes one feature across a mini-batch, subtracts the batch mean and divides by the standard deviation.
> - It then applies a learnable scale $\gamma$ and shift $\beta$, so the network can undo the normalising if that helps.
> - $\partial L/\partial\beta=\sum_i\delta_i$ and $\partial L/\partial\gamma=\sum_i\delta_i\bar x_i$, with $\delta_i=\partial L/\partial o_i$.
> - Training uses the current batch's mean and variance; test time uses running averages stored during training.

## What goes wrong without it

The numbers batch norm works on are pre-activations: the value $z=\mathbf w\cdot\mathbf x+b$ a neuron computes before the activation function $f$ turns it into $a=f(z)$. A mini-batch is the handful of samples the network sees in one training step. Here is one neuron's pre-activation for four samples in a batch: $2,\ 4,\ 6,\ 8$. I'll use them for the rest of the note.

A sigmoid has slope $\sigma(z)(1-\sigma(z))$, and the slope is what carries learning signal backwards. At these four values:

| $z$ | 2 | 4 | 6 | 8 |
|---|---|---|---|---|
| slope | 0.1050 | 0.0177 | 0.0025 | 0.0003 |

Already at 8 the slope is a third of a thousandth, and at 80 it would be zero for practical purposes. Centring the batch (its mean is 5) and dividing by its spread (2.236, worked out below) turns the values into $-1.342,\ -0.447,\ 0.447,\ 1.342$ and the slopes become 0.164, 0.238, 0.238, 0.164. Even the smallest is hundreds of times the 0.0003 we had at 8.

## The calculation on 2, 4, 6, 8

Four values is a batch of size $m=4$. The mean is the average, $\mu_B=(2+4+6+8)/4=5$. The variance is the average squared distance from the mean:

$$\sigma_B^2=\frac{9+1+1+9}{4}=5$$

The standard deviation is its square root, $\sigma_B=\sqrt5=2.236$. It is a typical distance from the mean, in the same units as the data.

Each value then has the mean taken away and is divided by the standard deviation. The result is written $\bar x_i$ (not $\widehat{x}$, because in this series a hat always means a prediction):

$$\bar x=\frac{[2,4,6,8]-5}{2.236}=\frac{[-3,-1,1,3]}{2.236}$$

$$\bar x=[-1.342,\ -0.447,\ 0.447,\ 1.342]$$

They add to 0, and their squares add to 4, so the mean is 0 and the variance is 1. That holds for any batch, not just this one.

Forcing every feature to mean 0 and spread 1 would limit what a layer can express, because a sigmoid fed only those values stays on its nearly straight middle part. The layer therefore gets two learned numbers per feature, a scale $\gamma$ and a shift $\beta$, and outputs $o_i=\gamma\bar x_i+\beta$. Let $\gamma=1.2$ and $\beta=0.3$:

$$o=1.2\,[-1.342,\ -0.447,\ 0.447,\ 1.342]$$

$$\qquad{}+0.3$$

$$o=[-1.31,\ -0.24,\ 0.84,\ 1.91]$$

![Two columns: training normalises the batch [2, 4, 6, 8] with its own mean 5 and variance 5 and updates running averages; test normalises a single input 6 with the stored averages; both use gamma 1.2 and beta 0.3](img/batch-norm-bn-train-test-flow.svg)

## The general formula

For a feature with values $x_1,\dots,x_m$ across the batch:

$$\mu_B=\frac1m\sum_{i=1}^m x_i$$

$$\sigma_B^2=\frac1m\sum_{i=1}^m (x_i-\mu_B)^2$$

$$\bar x_i=\frac{x_i-\mu_B}{\sqrt{\sigma_B^2+\epsilon}}$$

$$o_i=\gamma\,\bar x_i+\beta$$

Check against the numbers: $m=4$, the sums give 5 and 5, and $\bar x_1=(2-5)/\sqrt5=-1.342$, as above. The divisor is $m$, not $m-1$. The small constant $\epsilon$ (about $10^{-5}$) only prevents a division by zero when every value in the batch is equal; we used $\epsilon=0$ above. If a question gives $\epsilon$, keep it inside the square root.

The learned numbers can also switch the whole thing off. With $\gamma=\sigma_B$ and $\beta=\mu_B$ (and $\epsilon=0$):

$$o_i=\sigma_B\cdot\frac{x_i-\mu_B}{\sigma_B}+\mu_B=x_i$$

Anywhere between fully normalised and untouched is reachable, and gradient descent picks where $\gamma$ and $\beta$ settle.

For a matrix batch with samples as rows and features as columns, the mean and variance are taken down each column, and every column $j$ has its own $\gamma_j$ and $\beta_j$. Taking them along rows is a different thing and gives wrong numbers.

## Learning γ and β

These two are trained like any other weights. Let $L$ be the loss and suppose the errors arriving from above are $\delta_i=\partial L/\partial o_i$. Let $\delta=[0.5,\ -0.5,\ 1,\ -1]$ and the learning rate be $\eta=0.1$.

Each $o_i$ equals $\gamma\bar x_i+\beta$, so nudging $\beta$ by 1 nudges every $o_i$ by 1, and nudging $\gamma$ by 1 nudges $o_i$ by $\bar x_i$. The same $\gamma$ and $\beta$ serve every sample in the batch, so each sample contributes a term and the terms add:

$$\frac{\partial L}{\partial\beta}=0.5-0.5+1-1=0$$

$$\frac{\partial L}{\partial\gamma}=0.5(-1.342)-0.5(-0.447)$$

$$+1(0.447)-1(1.342)$$

$$=-0.671+0.224+0.447-1.342$$

$$=-1.342$$

The $\beta$ gradient is zero only because these errors happen to sum to zero. Then the usual update $w\leftarrow w-\eta\cdot\text{gradient}$:

$$\gamma_{\text{new}}=1.2-0.1(-1.342)=1.334$$

$$\beta_{\text{new}}=0.3-0.1(0)=0.3$$

In general, $\partial L/\partial\beta=\sum_i\delta_i$ and $\partial L/\partial\gamma=\sum_i\delta_i\bar x_i$, which is how a bias and a weight behave (here the weight's input is $\bar x_i$). The error passed down to the normalised value is $\partial L/\partial\bar x_i=\gamma\,\delta_i=[0.6,\ -0.6,\ 1.2,\ -1.2]$. Passing it further down to $x_i$ also has to go through $\mu_B$ and $\sigma_B$, which depend on every sample in the batch. That expression is longer and I've left it out.

## At test time

When the network is used on a single new input, there is no batch. One value has variance 0, and a prediction should not change depending on which other samples happen to be grouped with it. So during training the layer also keeps running averages of the batch statistics, updated after every batch with a small momentum $\alpha$:

$$\text{EMA}_\mu\leftarrow(1-\alpha)\,\text{EMA}_\mu+\alpha\,\mu_B$$

The variance average is updated the same way. As a small case, if the stored mean was 4 and $\alpha=0.1$, this batch (mean 5) moves it to $0.9\cdot4+0.1\cdot5=4.1$. After many batches it settles near the typical batch mean.

One catch on the variance: the original paper stores the unbiased estimate for test time (divide by $m-1$, so 20/3 rather than 5 for this batch), and PyTorch's running variance does the same. The divide-by-$m$ rule is for the batch statistics during training. If a question hands you the stored values, just use them.

At test time the layer uses these stored values with the learned $\gamma$ and $\beta$:

$$o=\gamma\,\frac{x-\text{EMA}_\mu}{\sqrt{\text{EMA}_{\sigma^2}+\epsilon}}+\beta$$

Suppose training has finished with stored values 5 and 5, and a single input $x=6$ arrives:

$$o=1.2\cdot\frac{6-5}{\sqrt5}+0.3=0.837$$

You'd get 0.837 whether that input arrives alone or alongside others.

Batch size 1 during training is a real problem, because the batch variance is 0. Running averages fix this only for test time. For training with tiny batches, normalisations that do not use the batch, such as layer norm or group norm, are used instead.

The original paper puts batch norm after the linear (or convolution) step and before the activation, which fits the sigmoid problem from the start of this note. You'll also see it placed after the activation. If a question asks where it goes, pick one and say why.

The [original paper by Ioffe and Szegedy](https://arxiv.org/abs/1502.03167) has the full backward pass down to $x_i$, and the [d2l.ai chapter](https://d2l.ai/chapter_convolutional-modern/batch-norm.html) builds the layer in code.

## Practice: gradients, a new batch, a test input

If every $\partial L/\partial o_i$ equals $c$ in a batch of $m$, what are $\partial L/\partial\beta$ and $\partial L/\partial\gamma$?

<details><summary>Answer</summary>

$\partial L/\partial\beta=mc$, since it is $c$ added $m$ times.

$$\frac{\partial L}{\partial\gamma}=c\sum_i\bar x_i=0$$

The normalised values always sum to zero.

</details>

A feature has values $[1,3,5,7]$ and $\epsilon=0$. What is $\bar x$?

<details><summary>Answer</summary>

The mean is 4 and the variance is $(9+1+1+9)/4=5$, so

$$\bar x=\frac{[-3,-1,1,3]}{\sqrt5}$$

$$=[-1.342,\ -0.447,\ 0.447,\ 1.342]$$

</details>

A single test image arrives. Which mean and variance does the layer use, and why?

<details><summary>Answer</summary>

The running averages saved during training. One sample has no usable batch variance, and the output should not depend on other samples.

</details>

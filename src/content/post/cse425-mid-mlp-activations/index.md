---
title: "Multilayer Perceptrons and Activation Functions"
description: "How stacked layers of neurons solve XOR, a sigmoid forward pass in matrix form with its parameter count, and why ReLU keeps its slope."
publishDate: '2026-11-02'
draft: true
tags: [neural-networks, cse425, mlp, activations]
series: "CSE 425 Mid"
part: 2
---

No single perceptron gets all four XOR rows right. Put two neurons in front of it and the same four rows pass. Each of the two extra neurons draws its own line, and the last neuron combines them: "x1 and not x2" OR "x2 and not x1".

A multilayer perceptron (MLP) is that idea made general. It's layers of neurons where each layer feeds the next one and nothing flows backwards.

> **Key Takeaways**
> - A layer is a matrix multiply plus a bias, followed by an activation function applied to each number separately.
> - Without a nonlinear activation, any stack of layers collapses into a single layer.
> - A layer with $n_l$ neurons fed by $n_{l-1}$ numbers has $n_l(n_{l-1}+1)$ parameters.
> - A sigmoid slope is never above 0.25, a tanh slope never above 1, and a ReLU slope is exactly 1 for every positive input.

## Two lines instead of one

Let the first hidden neuron fire when $x_1-x_2-0.5>0$, which is true only for the input $(1,0)$, and the second when $-x_1+x_2-0.5>0$, true only for $(0,1)$. The output neuron fires when $h_1+h_2-0.5>0$, that is, when at least one of the two hidden neurons fired. Tracing the four inputs:

| $x_1x_2$ | $h_1$ | $h_2$ | output |
|---|---|---|---|
| 00 | 0 | 0 | 0 |
| 01 | 0 | 1 | 1 |
| 10 | 1 | 0 | 1 |
| 11 | 0 | 0 | 0 |

That is XOR. Each hidden neuron cuts off one corner of the input square, and the output fires in either corner and stays 0 in the band between the two lines. The layer between the inputs and the output is called a hidden layer, because you never see its values in the data.

![The 2-2-1 step network for XOR with weights 1 and -1 into the hidden units, biases -0.5, output weights 1 and 1, beside the input square cut by two parallel lines](img/mlp-activations-xor-network.svg)

For XNOR (1 when the inputs match) use $h_1=\mathrm{AND}$ with $\mathbf w=(1,1)$, $b=-1.5$, $h_2=\mathrm{NOR}$ with $\mathbf w=(-1,-1)$, $b=0.5$, and the same OR output.

## A forward pass with sigmoids

Step functions are awkward to train, so real networks replace them with smooth activation functions. Here is a $2\to2\to1$ network (2 inputs, 2 hidden neurons, 1 output) with a sigmoid on every neuron, input $\mathbf x=(1,\ 0.5)$ and

$$W^{(1)}=\begin{pmatrix}0.4&-0.2\\0.3&0.8\end{pmatrix}$$

$$\mathbf b^{(1)}=\begin{pmatrix}0.1\\-0.1\end{pmatrix}$$

$$W^{(2)}=(0.5\ \ -0.6)$$

$$b^{(2)}=0.2$$

Row 1 of $W^{(1)}$ holds the two weights of hidden neuron 1, and row 2 those of hidden neuron 2. The shapes are $(2\times2)(2\times1)\to2\times1$ for the hidden layer, then $(1\times2)(2\times1)\to1\times1$ for the output.

The hidden pre-activations, one per neuron, are

$$z^{(1)}_1=0.4(1)-0.2(0.5)+0.1=0.4$$

$$z^{(1)}_2=0.3(1)+0.8(0.5)-0.1=0.6$$

The sigmoid squashes each one:

$$a^{(1)}_1=\sigma(0.4)=0.5987$$

$$a^{(1)}_2=\sigma(0.6)=0.6457$$

The output neuron takes these two as its inputs:

$$z^{(2)}=0.5(0.5987)-0.6(0.6457)+0.2$$

$$=0.1120$$

$$\widehat{y}=\sigma(0.1120)=0.5280$$

In general, layer $l$ has $n_l$ neurons, the input is $\mathbf a^{(0)}=\mathbf x$, and layer $l$ computes

$$\mathbf z^{(l)}=W^{(l)}\mathbf a^{(l-1)}+\mathbf b^{(l)}$$

$$\mathbf a^{(l)}=f\!\left(\mathbf z^{(l)}\right)$$

Here $f$ acts on each entry separately. $W^{(l)}$ has shape $n_l\times n_{l-1}$ (out by in), so row $j$ is the weights of neuron $j$, and $\mathbf b^{(l)}$ has $n_l$ entries. In the example $n_1=2$ and $n_0=2$, which matches the $2\times2$ matrix above. Some lecture material stores $W$ as in by out and transposes it; pick one and keep it. Course papers also write $v$ for $z$ and $\varphi$ for $f$.

To run many inputs at once, put them side by side as columns of a matrix $X$. For the columns $(1,0.5)$, $(0,1)$ and $(1,0)$ the same network gives $\widehat{y}=(0.528,\ 0.5091,\ 0.5452)$ in one pass.

## Counting parameters

A parameter is any number the network can learn, so weights and biases. Each neuron in layer $l$ has $n_{l-1}$ weights and one bias, so the layer has $n_l(n_{l-1}+1)$ and the network has the sum over its layers. You want this number because it sets how much memory the network takes and how much data it needs.

A $2\to3\to1$ network has $3\cdot3+1\cdot4=13$. For $4\to5\to3$ I'd write the matrices out: $5\times4$ and $3\times5$, so $20+15$ weights, plus $5+3$ biases, 43 in total. With one more layer, $3\to4\to3\to2$, it's $12+12+6=30$ weights and $4+3+2=9$ biases, so 39.

## Why the activation must be nonlinear

Without $f$, two layers give $W_2(W_1\mathbf x)=(W_2W_1)\mathbf x$, which is one matrix. With $W_1=\begin{pmatrix}1&2\\0&1\end{pmatrix}$ and $W_2=(3\ \ -1)$:

$$W_2W_1=(3\cdot1-1\cdot0\ \ \ \ 3\cdot2-1\cdot1)=(3\ \ 5)$$

Stack a hundred of them and you still get one matrix. The XOR network above only works because a step function sits between its layers.

## Three activation functions

Training adjusts the weights using slopes, so you need to know each activation's slope as well as its shape. The three common choices are below, and the [d2l.ai chapter on multilayer perceptrons](https://d2l.ai/chapter_multilayer-perceptrons/mlp.html) plots each of them with its slope.

| | formula | range | slope | notes |
|---|---|---|---|---|
| sigmoid | $\sigma(z)=\dfrac1{1+e^{-z}}$ | $(0,1)$ | $\sigma(1-\sigma)\le0.25$ | flat tails, not zero-centred |
| tanh | $\dfrac{e^z-e^{-z}}{e^z+e^{-z}}$ | $(-1,1)$ | $1-\tanh^2\le1$ | zero-centred, still flat tails |
| ReLU | $\max(0,z)$ | $[0,\infty)$ | 1 if $z>0$, 0 if $z<0$ | slope at 0 undefined, choose 0 or 1 |

Sigmoid and tanh squash every input into a fixed range, which is why they are called squashing functions. "Zero-centred" means the outputs are balanced around 0 instead of all being positive. Tanh is a rescaled sigmoid: $\tanh z=2\sigma(2z)-1$, and at $z=1.3$ both sides give 0.8617. The [prerequisites note](/blog/cse425-mid-prerequisites/) proves the sigmoid slope. For tanh the quotient rule gives

$$\tanh'(z)=\frac{(e^z+e^{-z})^2-(e^z-e^{-z})^2}{(e^z+e^{-z})^2}$$

$$\tanh'(z)=1-\tanh^2(z)$$

Some lecture versions give the sigmoid a steepness $a$, as $\varphi(v)=1/(1+e^{-av})$ with slope $a\varphi(1-\varphi)$. As $a$ grows it turns into a step.

![Sigmoid, tanh and ReLU on -6 to 6 with their derivatives underneath; the sigmoid slope peaks at 0.25 at z = 0 and both sigmoid and tanh slopes are flat in the tails](img/mlp-activations-activation-plots.svg)

Values at three inputs:

| $z$ | ReLU | $\sigma$ | $\sigma'$ | tanh | $\tanh'$ |
|---|---|---|---|---|---|
| $-2$ | 0 | 0.1192 | 0.105 | $-0.964$ | 0.0707 |
| $0$ | 0 | 0.5 | 0.25 | 0 | 1 |
| $3$ | 3 | 0.9526 | 0.0452 | 0.9951 | 0.0099 |

## Vanishing gradients and dead units

Training will multiply one slope per layer on the way back (the backprop notes show where). If every layer is a sigmoid, that product is at most $0.25^n$ after $n$ layers: $0.25^5\approx9.8\times10^{-4}$ and $0.25^{10}\approx9.5\times10^{-7}$. That is the best case, before the weights enter. With a product that small the early layers get almost no signal to learn from. That's a vanishing gradient. ReLU passes slope 1 for positive inputs, and that's the reason it's the usual hidden-layer choice.

Its weakness is the dead unit: if the input to a ReLU is negative for every example, its slope is 0 and the neuron never changes. One zero output on one example does not make a neuron dead.

## What a hidden layer can approximate

One hidden layer with enough neurons and a non-polynomial activation can approximate any continuous function on a bounded region (the [universal approximation theorem](https://en.wikipedia.org/wiki/Universal_approximation_theorem)). The intuition is that two sigmoids subtract to a bump, and bumps of different heights add up to a curve. For $x=0,\dots,5$, the bump $\sigma(10(x-1.5))-\sigma(10(x-3.5))$ gives $0,\ 0.0067,\ 0.9933,\ 0.9933,\ 0.0067,\ 0$. The theorem is only an existence statement. It gives no bound on how many neurons are needed and no promise that training finds the weights.

## Practice on counts, linear stacks and slopes

How many parameters does a $5\to4\to2$ network have?

<details><summary>Answer</summary>

The shapes are $W^{(1)}$ of $4\times5$ and $W^{(2)}$ of $2\times4$.

$$4(5+1)+2(4+1)=24+10=34$$

</details>

Why can a ten-layer network with no activation function not learn XOR?

<details><summary>Answer</summary>

Ten matrices multiply into one matrix, so the network is a single linear map plus a bias. It draws one line, and one line cannot separate XOR.

</details>

Give the best-case size of the gradient signal after 5 sigmoid layers and say what changes with ReLU.

<details><summary>Answer</summary>

At most $0.25^5\approx9.8\times10^{-4}$. With ReLU the slope is 1 where the input is positive, so the product does not shrink from the activations alone.

</details>

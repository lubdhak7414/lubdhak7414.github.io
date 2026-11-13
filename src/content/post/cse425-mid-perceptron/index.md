---
title: "Perceptron learning rule: AND by hand, and why not XOR"
description: "The perceptron learning rule run by hand on AND from zero weights, how many Boolean functions one line can split, and a four-line proof that XOR is not one."
publishDate: '2026-11-02'
tags: [neural-networks, cse425, perceptron]
series: "CSE 425"
section: "Mid"
part: 1
---

Is the point $(1, 3)$ a yes or a no under this rule: add $2x_1 - x_2 - 1$, and say yes if the total is positive? The total is $2 - 3 - 1 = -2$, so the answer is no. That rule is a perceptron: a weighted sum plus a bias, cut into yes or no. It gets a note of its own because it can also fix its weights each time it gets an example wrong.

> **Key Takeaways**
> - A perceptron outputs 1 if its weighted sum plus bias is positive, else 0, so it draws one straight line.
> - After a wrong answer it adds the input to its weights or subtracts it; a right answer changes nothing.
> - One perceptron can learn AND, OR and NOT, but not XOR: its two 1s sit on opposite corners.
> - Of the 16 Boolean functions of two inputs, 14 are linearly separable and 2 (XOR and XNOR) are not.

## A weighted sum with a hard cut

A perceptron is one neuron whose activation is a hard threshold. It multiplies each input by a weight, adds a bias $b$, and calls the total $z$:

$$z=\mathbf w\cdot\mathbf x+b$$

Its output $\widehat{y}$ is 1 if $z>0$ and 0 otherwise. Some texts fire on $z\ge 0$. Only inputs sitting exactly on the boundary change, so say which one you use. The [prerequisites note](/blog/cse425-mid-prerequisites/) explains the dot product and the other symbols.

Some books describe the same thing with a threshold $\theta$: fire if $\sum w_ix_i\ge\theta$. Move $\theta$ to the left and you get $\sum w_ix_i-\theta\ge 0$, so the bias is $b=-\theta$. A third version writes the bias as an extra input $x_0=-1$ with weight $\theta$. All three give the same line.

Where is that line? It is the set of points where $z=0$. For $3x_1-4x_2+12=0$, setting $x_2=0$ gives $x_1=-4$ and setting $x_1=0$ gives $x_2=3$, so the line crosses the axes at $(-4,0)$ and $(0,3)$. The weight vector $\mathbf w$ points at right angles to the line, towards the side where $z$ is positive. Every point on that side is called 1 and every point on the other side 0. With two inputs, one line is the only kind of boundary a single perceptron can draw.

## Learning AND from zero

All weights and the bias begin at 0, the learning rate is $\eta=1$, and the four inputs arrive in the order $00,\,01,\,10,\,11$. The target $y$ is 1 only for $11$. One full run through the four inputs is called an epoch or a pass.

With $\mathbf w=(0,0)$ and $b=0$, every input gives $z=0$, so the output is 0 for all of them. Three of those are right. The input $11$ is wrong: the output was 0 and the target was 1. To repair that, $z$ for this input has to get bigger, which happens if the input is added to the weights and 1 is added to the bias:

$$\mathbf w=(0,0)+(1,1)=(1,1)$$

$$b=0+1=1$$

Written as a rule that also covers the other kind of mistake, with error $e=\widehat{y}-y$ (which is 0 when the answer is right, $-1$ when it said 0 but should say 1, and $+1$ for the reverse):

$$w_i\leftarrow w_i-\eta\,e\,x_i$$

$$b\leftarrow b-\eta\,e$$

For $11$ we had $e=0-1=-1$, so each weight went up by $\eta x_i=1$ and the bias went up by 1, which matches what we did. Some slides write the same rule as $w_i\leftarrow w_i+\eta\,(y-\widehat{y})\,x_i$.

Why does it help? After the update the new sum for the same input is

$$z_\text{new}=z-\eta\,e\,\big(\lVert\mathbf x\rVert^2+1\big)$$

where $\lVert\mathbf x\rVert^2=x_1^2+x_2^2$ is the input's squared length. For $11$: $z_\text{new}=0+1\cdot(2+1)=3$, and indeed $1+1+1=3$. The sum moved the right way by an amount that cannot be zero.

Now carry on. After epoch 1 the weights are $\mathbf w=(1,1)$ and $b=1$. In epoch 2:

- Input $00$: $z=1$, so the output is 1 but the target is 0. Here $e=+1$, so subtract: $\mathbf w=(1,1)$, $b=0$.
- Input $01$: $z=1$, output 1, target 0. Subtract $(0,1)$ and 1: $\mathbf w=(1,0)$, $b=-1$.
- Input $10$: $z=1+0-1=0$, output 0, target 0. Correct, nothing moves.
- Input $11$: $z=1+0-1=0$, output 0, target 1. Add $(1,1)$ and 1: $\mathbf w=(2,1)$, $b=0$.

Three corrections that pass. The same rule applies on the later passes, and the weights at the end of each one are:

| Pass | End weights | End bias | Corrections |
|---|---|---|---|
| 3 | $(2,1)$ | $-1$ | 3 |
| 4 | $(2,2)$ | $-1$ | 2 |
| 5 | $(2,1)$ | $-2$ | 1 |
| 6 | $(2,1)$ | $-2$ | 0 |

Redoing pass 3 from the end of pass 2 is a good test of whether you have the rule. Pass 6 changes nothing, so training stops with $\mathbf w=(2,1)$ and $b=-2$. Check all four inputs: $z(11)=2+1-2=1>0$ fires, $z(10)=0$, $z(01)=-1$ and $z(00)=-2$ do not. Only $11$ fires, which is AND.

The textbook AND weights, $(1,1)$ with $b=-1.5$, are also valid, but the rule does not produce them from zero. A different start or order lands on a different valid answer. OR from the same start ends at $\mathbf w=(1,1)$, $b=0$ after four passes, the last one with no corrections. XOR from zero never settles: from pass 2 onwards the weights go round the same loop of values, $(-1,0)$ with $b=1$ at the end of every pass.

If a line exists that separates the classes, the rule makes only finitely many mistakes. With labels written as $\pm1$, the bias folded into $\mathbf x$, $R$ the length of the longest input and $\gamma$ the margin (the gap between the closest point and a separating line), the number of mistakes is at most $(R/\gamma)^2$. If no line exists, the rule never settles. The [Wikipedia article on the perceptron](https://en.wikipedia.org/wiki/Perceptron) has the proof of the bound.

## What one perceptron can do, and what it cannot

AND, OR and NOT are all fine. A valid AND is $\mathbf w=(1,1)$ with $b=-1.5$, because only $11$ reaches $1+1-1.5=0.5>0$. A valid OR is $\mathbf w=(1,1)$ with $b=-0.5$, because every input except $00$ is at least $1-0.5=0.5$.

A function is linearly separable if one straight line can put all its 1s on one side and all its 0s on the other. In the figure, AND and OR have such a line, and XOR does not.

![Three unit-square plots: AND split by the line x1 + x2 = 1.5, OR split by x1 + x2 = 0.5, and XOR with no single separating line](img/perceptron-plane.svg)

XOR (1 when exactly one input is 1) needs, row by row,

$$b\le 0,\qquad w_1+b>0$$

$$w_2+b>0,\qquad w_1+w_2+b\le 0$$

Add the middle two inequalities to get $w_1+w_2+2b>0$. But the last row says $w_1+w_2+b\le 0$ and the first says $b\le 0$, so adding those gives $w_1+w_2+2b\le 0$. Both cannot hold, so no weights exist.

The same trick works for three inputs. For a function with $f(010)=f(101)=1$ and $f(011)=f(100)=0$, adding the two 1-rows gives $w_1+w_2+w_3+2b$, and so does adding the two 0-rows. The 1-rows need a positive total and the 0-rows need a total of at most 0, yet the two totals are the same number.

## Counting the functions one perceptron can do

There are $2^{2^n}$ Boolean functions of $n$ inputs, since a truth table has $2^n$ rows and each can be 0 or 1. The linearly separable ones are far fewer:

| $n$ | functions $2^{2^n}$ | separable | not separable |
|---|---|---|---|
| 1 | 4 | 4 | 0 |
| 2 | 16 | 14 | 2 |
| 3 | 256 | 104 | 152 |
| 4 | 65536 | 1882 | 63654 |
| 5 | 4294967296 | 94572 | 4294872724 |

Not separable is $2^{2^n}$ minus separable. The separable counts are the published sequence [A000609](https://oeis.org/A000609), which gives 4, 14, 104, 1882 and 94572 for $n=1$ to 5. For $n=2$ the two failures are XOR and XNOR. At $n=5$ the separable ones are under 95,000 out of more than four billion, so for almost every function one neuron is not enough.

## Getting past one line

XOR can still be computed if you give up on a single plain perceptron. One way is a feature map that adds a product input: with $\phi=(x_1,x_2,x_1x_2)$, XOR is $x_1+x_2-2x_1x_2$, which is linear in $\phi$. Check: it gives 0, 1, 1, 0 on $00,01,10,11$. The other way is a hidden layer, covered in the [next note](/blog/cse425-mid-mlp-activations/). Any Boolean function can be written as an OR of ANDs, and a NOT is just a negative weight, so two layers of perceptrons can compute any of them.

For a design question, write the truth table first, choose weights and the bias, state whether you fire at $z>0$ or $z\ge0$, and test every row. If one row fails, the weights compute some other function.

## Practice: outputs, updates and separability

With $\mathbf w=(2,-1)$ and $b=-1$, what does the perceptron output for the input $(1,3)$?

<details><summary>Answer</summary>

$$z=2-3-1=-2$$

The sum is negative, so the output is 0 (or $-1$ in a $\pm1$ convention).

</details>

A perceptron has $\mathbf w=(1,1)$ and $b=-1$, a target of 1 and the input $(1,0)$, with $\eta=1$. What are the new weights and bias?

<details><summary>Answer</summary>

$z=1+0-1=0$, so the output is 0 and $e=0-1=-1$.

$$\mathbf w=(1,1)+(1,0)=(2,1)$$

$$b=-1+1=0$$

</details>

A function has $f(010)=f(101)=1$ and $f(011)=f(100)=0$. Why is it not linearly separable?

<details><summary>Answer</summary>

Both pairs add up to $w_1+w_2+w_3+2b$. The two 1-rows need that total to be positive and the two 0-rows need it to be at most 0.

</details>

Training never reaches zero errors. Give two reasons.

<details><summary>Answer</summary>

The data is not linearly separable, as in XOR, or the labels contain noise or a mistake. A sign error in the update does it too.

</details>

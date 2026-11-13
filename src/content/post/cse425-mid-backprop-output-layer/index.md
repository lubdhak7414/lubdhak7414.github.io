---
title: "Backpropagation output layer delta, worked example"
description: "The output neuron's delta as error times sigmoid slope, the weight and bias updates worked with numbers, and a nudge test that checks the formula."
publishDate: '2026-11-02'
tags: [neural-networks, cse425, backprop]
series: "CSE 425"
section: "Mid"
part: 3
---

Predicting 0.55 for a target of 1 leaves a network 0.45 short. That single number has to be turned into a change for every weight, because each weight contributed some unknown share of the miss. Backpropagation is the method for finding each share.

The last layer is the easy case, since its weights touch the error directly. This note does the last layer, and the [next one](/blog/cse425-mid-backprop-hidden-layers/) passes the result back through the hidden layers.

> **Key Takeaways**
> - A neuron's delta is $\delta=\partial L/\partial z$: how much the loss moves per unit nudge of its weighted sum.
> - For an output neuron, $\delta=e\,f'(z)$, where $e=\widehat{y}-y$ is the error and $f'$ is the activation's slope.
> - Each weight changes by $-\eta\,\delta$ times the signal that arrived on it, and the bias by $-\eta\,\delta$.
> - A sigmoid neuron stuck near 0 or 1 has a slope near 0, so its weights barely move.

## One output neuron, with numbers

One sigmoid output neuron receives two signals from a hidden layer, $a_1=0.64566$ and $a_2=0.52498$. Its weights are $w_1=0.6$ and $w_2=-0.7$, its bias is $b=0.2$, the target is $y=1$ and the learning rate is $\eta=0.5$.

Forward first. The weighted sum is

$$z=0.6(0.64566)-0.7(0.52498)+0.2$$

$$=0.21991$$

and the output is $\widehat{y}=f(0.21991)=0.55476$. The error is the output minus the target:

$$e=0.55476-1=-0.44524$$

The sigmoid slope at this $z$ is $f'(z)=0.55476\,(1-0.55476)=0.24700$. The delta is the error times the slope:

$$\delta=e\,f'(z)=-0.44524\times0.24700$$

$$=-0.10998$$

Each weight then moves by $-\eta\,\delta$ times the signal that came in on it:

$$w_1\leftarrow0.6-0.5(-0.10998)(0.64566)$$

$$=0.63550$$

$$w_2\leftarrow-0.7-0.5(-0.10998)(0.52498)$$

$$=-0.67113$$

$$b\leftarrow0.2-0.5(-0.10998)=0.25499$$

The delta is negative, which says that raising $z$ would lower the loss. Both incoming signals are positive, so every weight goes up. $w_2$ was negative and moved up towards zero. The neuron needs a bigger $z$ to reach the target of 1, and the signal on $w_2$ is positive, so a less negative weight helps.

Did it work? With the same two incoming signals and the new weights, the loss is $\tfrac12(\widehat{y}-y)^2=0.08921$, down from 0.09912.

## Why those formulas

Let neuron $k$ be an output neuron, and let $w_{kj}$ be the weight from neuron $j$ of the layer before into neuron $k$ (the first index is the destination). With $a_j$ the output of neuron $j$ and $f$ the activation function,

$$z_k=\sum_j w_{kj}a_j+b_k$$

$$\widehat{y}_k=a_k=f(z_k)$$

$$e_k=\widehat{y}_k-y_k$$

and the loss is $L=\tfrac12\sum_k e_k^2$, summed over the output neurons. The error is output minus target because that difference is exactly the slope of the loss $\tfrac12 e^2$ with respect to the output. It is positive when the output is too high and negative when it is too low. The $\tfrac12$ cancels the 2 that differentiating produces.

The delta is defined as the slope of the loss with respect to the pre-activation:

$$\delta_k=\frac{\partial L}{\partial z_k}$$

The loss reaches $z_k$ through the output $\widehat{y}_k$, so the chain rule has two factors:

$$\frac{\partial L}{\partial z_k}=\frac{\partial L}{\partial \widehat{y}_k}\cdot\frac{\partial \widehat{y}_k}{\partial z_k}$$

The first is $e_k$, because only the $k$-th square in the sum depends on $\widehat{y}_k$, and the slope of $\tfrac12(\widehat{y}_k-y_k)^2$ with respect to $\widehat{y}_k$ is $\widehat{y}_k-y_k$. The second is $f'(z_k)$. Multiplying them:

$$\delta_k=e_k\,f'(z_k)$$

For the weight, $z_k=\sum_j w_{kj}a_j+b_k$ contains $w_{kj}$ in one term only, so $\partial z_k/\partial w_{kj}=a_j$. The chain rule then gives the gradient, and gradient descent moves against it:

$$\frac{\partial L}{\partial w_{kj}}=\delta_k\,a_j$$

$$w_{kj}\leftarrow w_{kj}-\eta\,\delta_k\,a_j$$

The bias is a weight whose incoming signal is always 1, which is why its update has no $a_j$:

$$b_k\leftarrow b_k-\eta\,\delta_k$$

Writing the error the other way round, $e=y-\widehat{y}$, makes the update run uphill unless you also flip the sign in the update, so keep to one convention for the whole answer. Some course papers do exactly that: they write $d$, $v$ and $\varphi$ for the target, the pre-activation and the activation function, take the error as target minus output, and use $\delta=-\partial E/\partial z$. Every $\delta$ then has the opposite sign to the ones here, and the weight updates come out identical.

For a sigmoid, $f(z)=1/(1+e^{-z})$, the slope can be read off the stored output, because the [prerequisites note](/blog/cse425-mid-prerequisites/) shows that $f'(z)=a(1-a)$. At $z=0.21991$ the direct formula gives

$$\frac{e^{-z}}{(1+e^{-z})^2}=0.24700$$

which equals $0.55476\times0.44524$, the value used above. No new exponential is needed during backprop. A neuron stuck near $a=0$ or $a=1$ has $a(1-a)\approx 0$, so its $\delta$ is tiny and its weights barely move.

## Checking the formula against the numbers

The formula says that $\partial L/\partial w_1=\delta\,a_1$, which is $-0.10998\times0.64566=-0.07101$. That can be tested without any calculus: raise $w_1$ from 0.6 to 0.61, recompute the neuron and its loss, and compare. The loss falls by 0.000709, and the formula predicts $-0.07101\times0.01=-0.000710$. Close enough, and a smaller nudge would bring them closer still. It costs one extra forward pass, so I'd run it on any derivation where a sign or an index looks doubtful.

If the target is already met, $\widehat{y}=y$, so $e=0$ and $\delta=0$, and no weight changes whatever the slope is.

The [3Blue1Brown video on backpropagation](https://www.3blue1brown.com/lessons/backpropagation) shows the same nudging idea with pictures.

## Practice: the output delta

The output is $\widehat{y}=0.8$, the target is $y=0$, and the neuron is a sigmoid. What is $\delta$?

<details><summary>Answer</summary>

$$e=0.8-0=0.8$$

$$f'=0.8(1-0.8)=0.16$$

$$\delta=0.8\times0.16=0.128$$

It is positive, so weights on positive incoming signals go down.

</details>

Why does the bias update have no $a_j$ factor?

<details><summary>Answer</summary>

The bias multiplies a constant signal of 1, so $\partial z/\partial b=1$ and the update is $-\eta\,\delta$.

</details>

In the example, what would the update to $w_1$ be if the target were $y=0.55476$?

<details><summary>Answer</summary>

Then $e=0$, so $\delta=0$ and $w_1$ stays at 0.6.

</details>

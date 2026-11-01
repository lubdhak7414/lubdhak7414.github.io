---
title: "Backpropagation Part 1: Blaming the Output Layer"
description: "Compute the output-layer delta and update the last layer's weights and bias by hand, with a sigmoid neuron."
publishDate: '2026-11-02'
draft: true
tags: [neural-networks, cse425, backprop]
series: "CSE 425 Mid"
part: 3
---

## Quick idea

Your network predicts 0.55 and the target is 1. The error is 0.45, but a network has many weights, and you have to decide how much of that 0.45 each one caused. Backpropagation is the bookkeeping that hands out the blame.

The last layer is the easy case. Its weights touch the error directly, so the blame for each one is just the error, multiplied by how steeply the neuron's output responds, multiplied by the signal that arrived on that weight. Once you can do this for the output layer, Part 2 only has to pass the blame backwards one layer at a time.

One line to hold on to: the weight change is $\eta\,\delta\,a_{in}$, where $\delta$ is the neuron's blame.

## Picture it

The forward pass runs left to right and stores every $z$ and $a$. The backward pass starts from the error and works out $\delta$ at the output first.

```mermaid
flowchart LR
  A["inputs x"] --> B["z = w.a + b"]
  B --> C["a = f of z"]
  C --> D["error e = d - a"]
  D --> E["delta = e * f prime of z"]
  E --> F["change w by eta * delta * incoming a"]
```

## The detail

Notation follows the series: $z$ is a neuron's weighted sum plus bias, $a=f(z)$ its output, $\eta$ the learning rate. Some exam papers write $v$ for $z$, $y$ for $a$ and $\varphi$ for $f$. Same objects, different letters. The weight $w_{kj}$ goes from neuron $j$ into neuron $k$, so the first index is the destination.

For output neuron $k$ with target $d_k$:

$$z_k=\sum_j w_{kj}a_j+b_k,\qquad a_k=f(z_k),\qquad e_k=d_k-a_k,\qquad E=\tfrac12\sum_k e_k^2$$

Here $a_j$ is the output of a neuron in the previous layer, and $E$ is the loss. The $\tfrac12$ is only there so the 2 from differentiating cancels.

The blame of a neuron is defined as the negative slope of the loss with respect to its $z$:

$$\delta_k=-\frac{\partial E}{\partial z_k}$$

Derivation, every step. The loss reaches $z_k$ through $e_k$ and $a_k$:

$$\frac{\partial E}{\partial z_k}=\frac{\partial E}{\partial e_k}\,\frac{\partial e_k}{\partial a_k}\,\frac{\partial a_k}{\partial z_k}$$

Each factor is short. $\partial E/\partial e_k=e_k$, because only the $k$-th square in the sum depends on $e_k$. $\partial e_k/\partial a_k=-1$, because $e_k=d_k-a_k$. $\partial a_k/\partial z_k=f'(z_k)$. Multiply them and apply the minus sign from the definition:

$$\boxed{\delta_k=e_k\,f'(z_k)}$$

Now the weight. Since $z_k=\sum_j w_{kj}a_j+b_k$, only one term depends on $w_{kj}$, so $\partial z_k/\partial w_{kj}=a_j$. By the chain rule $\partial E/\partial w_{kj}=-\delta_k a_j$. Gradient descent moves against the slope:

$$\Delta w_{kj}=-\eta\frac{\partial E}{\partial w_{kj}}=\eta\,\delta_k\,a_j,\qquad \Delta b_k=\eta\,\delta_k$$

The bias is a weight whose incoming signal is always 1, which is why its update has no $a_j$.

The minus sign in the definition of $\delta$ is a convention. With it the update is $+\eta\delta a_j$. Without it you write $-\eta\,\partial E/\partial w$. They are the same rule, so pick one and keep it for the whole answer.

For a sigmoid, $f(z)=1/(1+e^{-z})$, the slope is read off the stored output:

$$f'(z)=\frac{e^{-z}}{(1+e^{-z})^2}=\frac{1}{1+e^{-z}}\cdot\frac{e^{-z}}{1+e^{-z}}=a\,(1-a)$$

The last step uses $1-a=\dfrac{e^{-z}}{1+e^{-z}}$. No new exponential is needed during backprop. A neuron stuck near $a=0$ or $a=1$ has $a(1-a)\approx 0$, so its $\delta$ is tiny and its weights barely move.

## Worked example

One sigmoid output neuron with two inputs from a hidden layer, $\eta=0.5$, target $d=1$. The incoming signals are $a_1=0.64566$ and $a_2=0.52498$, the weights are $w_1=0.6$, $w_2=-0.7$ and the bias is $b=0.2$.

Forward: $z=0.6(0.64566)-0.7(0.52498)+0.2=0.21991$, so $a=f(0.21991)=0.55476$ and $e=1-0.55476=0.44524$.

Slope: $f'(z)=0.55476(1-0.55476)=0.24700$.

Delta: $\delta=0.44524\times0.24700=0.10998$.

Updates, all positive because $\delta>0$ and both incoming signals are positive:

$$w_1^{new}=0.6+0.5(0.10998)(0.64566)=0.63550$$

$$w_2^{new}=-0.7+0.5(0.10998)(0.52498)=-0.67113,\qquad b^{new}=0.2+0.5(0.10998)=0.25499$$

$$\boxed{\delta=0.10998,\quad w_1\to 0.63550,\quad w_2\to -0.67113,\quad b\to 0.25499}$$

Note that $w_2$ was negative and moved up towards zero. The neuron needs a bigger $z$ to reach the target of 1, and the signal on $w_2$ is positive, so a less negative weight helps. Part 2 uses these same numbers inside a full 2-2-1 network.

## Exam corner

Asked in past exams. The output-layer delta is the first step of the "compute the local induced gradient for the first layer of a four-layer network" question, which appeared in 2 distinct quiz sittings among the papers we have. A Fall 2021 Mid asked about the signal-flow graph that returns the delta, which belongs to Part 2. The proof that the sigmoid derivative equals $f(1-f)$ was a quiz question. Across the papers we have, that is about 3 appearances in 2 semesters, and no numeric Mid question on backprop turned up, though numeric 2-2-2 questions are in the practice material.

Marks come from: defining $\delta$, the chain rule written out with its three factors, the final $\delta_k=e_k f'(z_k)$, and the update rule with the right indices.

Common slips: writing $e=y-d$ (it is $d-a$, and the update then moves the wrong way); forgetting $f'$ and using only the error; leaving the bias without its update; updating $w$ before you have finished computing the deltas.

Formula cheat line: $\delta_k=e_kf'(z_k)$, $\Delta w_{kj}=\eta\delta_ka_j$, $\Delta b_k=\eta\delta_k$, $f'=a(1-a)$ for sigmoid.

## Check yourself

Output $a=0.8$, target $d=0$, sigmoid. What is $\delta$?

<details><summary>Answer</summary>
$e=0-0.8=-0.8$ and $f'=0.8(0.2)=0.16$, so $\delta=-0.128$. Negative, so the weights on positive incoming signals go down.
</details>

Why does the bias update have no $a_j$ factor?

<details><summary>Answer</summary>
The bias multiplies a constant signal of 1, so $\partial z/\partial b=1$ and $\Delta b=\eta\delta$.
</details>

In the example, what would $\delta$ be if the target were already met, $a=d$?

<details><summary>Answer</summary>
$e=0$, so $\delta=0$ and no weight changes, whatever the slope.
</details>

## Read more

- [3Blue1Brown: What is backpropagation really doing?](https://www.3blue1brown.com/lessons/backpropagation) for the picture of nudging weights.
- [CS231n notes on backpropagation and the chain rule](https://cs231n.github.io/optimization-2/) for the same idea on computation graphs.
- [Wikipedia: Backpropagation](https://en.wikipedia.org/wiki/Backpropagation) for definitions and history.

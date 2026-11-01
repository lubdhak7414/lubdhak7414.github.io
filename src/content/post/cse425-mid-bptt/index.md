---
title: "Backpropagation Through Time"
description: "Compute the gradient of an unrolled RNN by hand, explain why it vanishes or explodes, and state what clipping and truncation fix."
publishDate: '2026-11-02'
draft: true
tags: [neural-networks, cse425, rnn, bptt]
series: "CSE 425 Mid"
part: 9
---

## Quick idea

Take a 3-step RNN with one recurrent weight $u=0.8$. Compute the loss at step 3 and push the error backward. By the time it reaches step 1 the signal has shrunk from $-0.657$ to $-0.230$, and nothing exotic happened. It just got multiplied by a factor below 1 at every step.

That is the whole story of backpropagation through time (BPTT). It is ordinary backprop on the unrolled network. Two things are new. The same weight appears at every step, so its gradient is a sum of one piece per step. And the error travelling backward passes through the same matrix again and again, so it is a product, and products of many numbers either die or blow up.

## Picture it

Unrolled for three steps, the error at step 3 has to travel back along the hidden-state chain. Each arrow backward multiplies by $u\cdot\tanh'$.

![Scalar RNN unrolled for three steps with forward values, tanh slopes and deltas; the delta shrinks by 0.557 and 0.629 going back, and the gradients of w and u are sums of one term per step](img/bptt-bptt-gradient-paths.svg)

*The delta shrinks by 0.557 and then 0.629 on its way back, and each shared weight collects one term per step: 0.2436 for w and -0.5310 for u.*

## The detail

Notation follows the series: $\mathbf z_t=W_{xh}\mathbf x_t+W_{hh}\mathbf h_{t-1}+\mathbf b_h$, $\mathbf h_t=\tanh(\mathbf z_t)$, output $\hat{\mathbf y}_t$ from $W_{hy}\mathbf h_t$. Total loss is $L=\sum_t L_t$. Some sources divide by $T$; that changes only a constant.

The delta recursion. Define $\boldsymbol\delta_t=\partial L/\partial\mathbf z_t$. Step $t$ affects the loss in two ways: through its own output $\hat{\mathbf y}_t$, and through the next hidden state $\mathbf h_{t+1}$. Add both contributions and multiply by the tanh slope $1-\mathbf h_t^2$:

$$\boldsymbol\delta_t=\mathrm{diag}\!\big(1-\mathbf h_t^2\big)\Big(W_{hy}^{\top}(\hat{\mathbf y}_t-\mathbf y_t)+W_{hh}^{\top}\boldsymbol\delta_{t+1}\Big),\qquad \boldsymbol\delta_{T+1}=\mathbf 0$$

The term $\hat{\mathbf y}_t-\mathbf y_t$ is what softmax with cross-entropy gives at the output. You start at $t=T$ and walk backward.

Time-summed gradients. $W_{hh}$ is used at every step, so each use contributes $\boldsymbol\delta_t\,\mathbf h_{t-1}^{\top}$ and the total is their sum:

$$\frac{\partial L}{\partial W_{hh}}=\sum_{t=1}^{T}\boldsymbol\delta_t\,\mathbf h_{t-1}^{\top},\qquad \frac{\partial L}{\partial W_{xh}}=\sum_{t=1}^{T}\boldsymbol\delta_t\,\mathbf x_t^{\top},\qquad \frac{\partial L}{\partial \mathbf b_h}=\sum_{t=1}^{T}\boldsymbol\delta_t$$

Forgetting this sum, and using a single term, is the most common slip.

Product-of-Jacobians form. Look at one loss term $L_t$ and ask how $W_{hh}$ reaches it. It reaches $\mathbf h_t$ through every earlier state $\mathbf h_i$, so

$$\frac{\partial L_t}{\partial W_{hh}}=\sum_{i=1}^{t}\frac{\partial L_t}{\partial \mathbf h_t}\Big(\prod_{j=i+1}^{t}\frac{\partial \mathbf h_j}{\partial \mathbf h_{j-1}}\Big)\frac{\partial^{+}\mathbf h_i}{\partial W_{hh}}$$

Here $\partial^{+}$ means the direct partial only, holding $\mathbf h_{i-1}$ fixed. Without that mark the equation double counts. The new object is the one-step Jacobian:

$$\frac{\partial \mathbf h_j}{\partial \mathbf h_{j-1}}=\mathrm{diag}\big(\tanh'(\mathbf z_j)\big)\,W_{hh}$$

Signal from step $t$ back to step $i$ passes through $t-i$ of these. Weights sum across time. Signal multiplies across time.

Vanishing and exploding. Taking norms,

$$\Big\|\frac{\partial \mathbf h_t}{\partial \mathbf h_i}\Big\|\le\prod_{j=i+1}^{t}\|W_{hh}\|\,\|\mathrm{diag}(\tanh'(\mathbf z_j))\|\le(\sigma_{\max}\gamma)^{t-i}$$

where $\sigma_{\max}$ is the largest singular value of $W_{hh}$ (how much the matrix can stretch a vector) and $\gamma\le1$ is the largest tanh slope. In the scalar case this is just $u^k$ after $k$ steps:

| $k$ | $0.9^k$ | $1.1^k$ |
|---|---|---|
| 5 | 0.5905 | 1.6105 |
| 10 | 0.3487 | 2.5937 |
| 20 | 0.1216 | 6.7275 |
| 50 | 0.0052 | 117.39 |

Add a typical tanh slope of 0.7 and $(0.9\times0.7)^{10}=0.0098$. Vanishing means early steps get almost no learning signal, so the network cannot link a word at step 1 to a loss at step 20. Exploding means a single update can wreck the weights.

Clipping. For explosions, rescale the gradient when its norm passes a threshold $c$: if $\|g\|>c$, set $g\leftarrow c\,g/\|g\|$. The direction is kept, only the length shrinks. Clipping does nothing for vanishing. Vanishing is handled by gated cells (the next two posts) and sensible initialisation.

Truncated BPTT. For long sequences, backpropagate only $\tau$ steps. Every term with $t-i>\tau$ is dropped. This is cheaper in time and memory, but the network cannot learn dependencies longer than $\tau$. The dropped terms are ignored, not set to a wrong value, and the gradient does not become zero.

## Worked example

Scalar RNN, $h_t=\tanh(wx_t+uh_{t-1})$, $h_0=0$, $w=0.5$, $u=0.8$, inputs $x=(1,\,0.5,\,-1)$, target $y=0.6$ at $t=3$ only, $L=\tfrac12(h_3-y)^2$.

Forward: $h_1=\tanh(0.5)=0.4621$, $h_2=\tanh(0.25+0.3697)=0.5509$, $h_3=\tanh(-0.5+0.4407)=-0.0592$, so $L=\tfrac12(-0.6592)^2=0.2173$.

Slopes $1-h^2$: $0.7864,\ 0.6965,\ 0.9965$.

Backward: $\delta_3=(h_3-y)(0.9965)=-0.6592\times0.9965=-0.6569$. Then $\delta_2=\delta_3\cdot u\cdot0.6965=-0.3660$ and $\delta_1=\delta_2\cdot u\cdot0.7864=-0.2303$.

Gradients, summed over time:

$$\frac{\partial L}{\partial w}=\delta_3x_3+\delta_2x_2+\delta_1x_1=0.6569-0.1830-0.2303=0.2436$$

$$\frac{\partial L}{\partial u}=\delta_3h_2+\delta_2h_1+\delta_1h_0=-0.3619-0.1691-0=-0.5310$$

One step with $\eta=0.5$: $w=0.5-0.5(0.2436)=0.3782$ and $u=0.8+0.5(0.5310)=1.0655$.

Truncate at $\tau=2$ by dropping the step-1 terms: $\partial L/\partial w=0.6569-0.1830=0.4739$, against the true $0.2436$. The step-1 piece was not small enough to ignore here. $\partial L/\partial u$ is unchanged because $h_0=0$ kills its step-1 term.

$$\boxed{\partial L/\partial w=0.2436,\quad \partial L/\partial u=-0.5310}$$

## Exam corner

Asked in past exams: the practice set has six items here (exploding gradients and clipping, long-range dependence from the repeated $W_{hh}$ product, truncated BPTT with $\tau=5$ and what it omits, singular values of 0.9 over $T=20$, distributing $\partial L/\partial W_{hh}$ across time, and teacher forcing). The explain-vanishing-gradients question appeared in 1 past paper we have, and it asks how gates fix it. A full numeric BPTT derivation did not show up in the past papers we could read, so expect the explanation and short-calculation forms.

Marks come from: drawing or stating the unrolled graph, writing the sum over time for the shared weight, showing the product of Jacobians, and concluding with the norm argument ($0.9^{20}\approx0.12$, $1.1^{20}\approx6.7$). For truncation, say which terms are omitted and name the trade-off.

Common slips: forgetting to sum over time; writing $\partial h_t/\partial W$ as one term; offering clipping as a fix for vanishing; saying truncation "makes gradients zero" instead of "ignores long-range paths". For teacher forcing, the advantage is faster convergence and the drawback is exposure bias at test time, when the model sees its own outputs.

Cheat line: $\delta_t=(1-h_t^2)\odot(W_{hy}^{\top}e_t+W_{hh}^{\top}\delta_{t+1})$, $\partial L/\partial W_{hh}=\sum_t\delta_th_{t-1}^{\top}$, factor per step $\approx\sigma_{\max}\gamma$.

## Check yourself

1. Why is the gradient for $W_{hh}$ a sum over time but the signal from step $t$ to step $i$ a product?

<details><summary>Answer</summary>The same weight is used at every step, so each use adds its own piece. The signal from $t$ back to $i$ passes through $t-i$ chained steps, and chained derivatives multiply.</details>

2. A gradient has norm 50 and the clip threshold is 5. What is the clipped gradient for $g=(30,40)$?

<details><summary>Answer</summary>$5\cdot(30,40)/50=(3,4)$. Direction unchanged, norm now 5.</details>

3. With $\tau=2$ on a 3-step sequence, which gradient terms are lost, and why can't truncation help with a 10-step dependency?

<details><summary>Answer</summary>Terms with $t-i>2$ are dropped, here the step-1 contributions. Any dependency longer than $\tau$ never receives gradient, so it cannot be learned.</details>

## Read more

- [d2l.ai on backpropagation through time](https://d2l.ai/chapter_recurrent-neural-networks/bptt.html), including truncation and the exploding and vanishing cases.
- [Pascanu et al., On the difficulty of training recurrent neural networks](https://arxiv.org/abs/1211.5063), the paper behind gradient clipping.

<!-- Reviewer note: the digest says the lecture did not cover BPTT, so the exam section relies on practice items and one past-paper count only. No solutions exist for practice items 23-30; the teacher forcing line is from the digest summary. 07a-rnn.md did not exist when this was written; the link assumes it will. -->

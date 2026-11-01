---
title: "LSTM"
description: "Write the LSTM gate equations from memory, trace one numeric step, and explain in two sentences why the cell state fixes vanishing gradients."
publishDate: '2026-11-02'
draft: true
tags: [neural-networks, cse425, rnn, lstm]
series: "CSE 425 Mid"
part: 10
---

Copy one token from step 5 to step 50 and a vanilla RNN has to pass the gradient back through 45 steps. If each step shrinks it by half, what is left is $0.5^{45}\approx 2.8\times10^{-14}$. Nothing is learned. An LSTM has a path where that same 45-step product can be $0.99^{45}=0.636$.

## Quick idea

An LSTM adds a second memory line, the cell state $c_t$, that runs through time next to the hidden state $h_t$. The cell state is only ever touched by an elementwise multiply and an elementwise add, so information (and gradient) can travel along it almost unchanged.

Three gates control that line. Each gate outputs numbers between 0 and 1 and works like a valve: 0 blocks, 1 passes, 0.65 lets 65% through. The forget gate decides how much old memory stays, the input gate decides how much new information is written, and the output gate decides how much of the memory is shown as $h_t$. The hidden state changes fast. The cell state changes slowly, and that is where the longer memory comes from.

## Picture it

![LSTM cell: cell state along the top through a forget multiply and an input add; forget, input and output gates and the tanh candidate read [h_t-1, x_t], each with its equation and worked-example value](img/lstm-lstm-cell.svg)

*The cell state is touched only by the forget multiply and the input add. In the worked example c_t = 0.8471 and h_t = 0.4373.*

![Backward paths through three time steps: the LSTM cell state multiplies by f_t at each step, the vanilla RNN by diag(1 - h^2) W_hh; bars compare 0.99^45 = 0.636 with 0.5^45 = 2.8e-14](img/lstm-lstm-gradient-highway.svg)

*Going back along the cell state costs only a factor f_t per step. A vanilla RNN pays a matrix and a tanh slope every step, which is how 0.5^45 shrinks to 2.8e-14.*

## The detail

Notation: $\sigma$ is the sigmoid, $\odot$ is the elementwise product, $[h_{t-1},x_t]$ stacks the previous hidden state (size $H$) on the input (size $I$), giving a vector of size $H+I$. Each weight matrix $W$ is $H\times(H+I)$ and each bias $b$ has size $H$.

Standard LSTM:

$$f_t=\sigma(W_f[h_{t-1},x_t]+b_f),\quad i_t=\sigma(W_i[h_{t-1},x_t]+b_i),\quad o_t=\sigma(W_o[h_{t-1},x_t]+b_o)$$

$$\tilde c_t=\tanh(W_c[h_{t-1},x_t]+b_c)$$

$$c_t=f_t\odot c_{t-1}+i_t\odot\tilde c_t,\qquad h_t=o_t\odot\tanh(c_t)$$

If a prediction is needed, $y_t=\mathrm{softmax}(W_y h_t+b_y)$. That is four small layers reading the same stacked vector: three sigmoid gates and one tanh candidate. Count them as three gates plus a candidate, not four gates.

The matrix workflow, which is a past question, is the same thing in one picture. Form four vectors $z^f=W_f[h_{t-1},x_t]+b_f$, $z^i$, $z^o$ and $z^c$ in parallel. Send $z^f,z^i,z^o$ through sigmoid and $z^c$ through tanh. Then apply the two lines for $c_t$ and $h_t$.

Why tanh for the candidate and not ReLU? Tanh is signed and bounded in $(-1,1)$, so a candidate can push a memory cell up or down. ReLU is non-negative and unbounded, so it can only add positive information and cannot shrink a value quickly.

Peephole LSTM. The gates are allowed to look at the cell state. Forget and input gates see the old cell, $c_{t-1}$. The output gate sees the new cell, $c_t$, because it is computed after the update. Everything else is unchanged. Two forms appear, so label which one you write.

Class-board form (full matrix over the concatenation):

$$f_t=\sigma(W_f[c_{t-1},h_{t-1},x_t]+b_f),\quad i_t=\sigma(W_i[c_{t-1},h_{t-1},x_t]+b_i),\quad o_t=\sigma(W_o[c_t,h_{t-1},x_t]+b_o)$$

Here each $W$ grows to $H\times(2H+I)$, adding $3H^2$ weights in total.

Textbook form (diagonal peephole, from the original peephole paper), with weight vectors $p_f,p_i,p_o$ of size $H$:

$$f_t=\sigma(W_f[h_{t-1},x_t]+p_f\odot c_{t-1}+b_f),\quad i_t=\sigma(W_i[h_{t-1},x_t]+p_i\odot c_{t-1}+b_i),\quad o_t=\sigma(W_o[h_{t-1},x_t]+p_o\odot c_t+b_o)$$

This adds only $3H$ weights. Either form earns marks if declared. Mixing them, or feeding $c_{t-1}$ to the output gate, does not.

Parameters. One block is $H(H+I)+H$. A vanilla RNN has one block, a GRU three, an LSTM four:

$$\text{LSTM}=4H(H+I+1)$$

So an LSTM has four times the RNN parameters, and a GRU has 75% of an LSTM's.

Why the gradient survives. For a vanilla RNN, $h_t=\tanh(W_{hh}h_{t-1}+\dots)$, so

$$\frac{\partial h_t}{\partial h_{t-1}}=\mathrm{diag}(1-h_t^2)\,W_{hh}.$$

Over $k$ steps the gradient is a product of $k$ of these. If each is below 1 in size, it shrinks like $r^k$.

For the LSTM, differentiate $c_t=f_t\odot c_{t-1}+i_t\odot\tilde c_t$ along the direct path:

$$\frac{\partial c_t}{\partial c_{t-1}}=\mathrm{diag}(f_t).$$

Other terms exist because $f_t,i_t,\tilde c_t$ depend on $h_{t-1}$, which depends on $c_{t-1}$, but they are smaller. Over $k$ steps the direct path is $\prod_{j}f_j$. There is no weight matrix and no tanh derivative on it, and the update is additive. The network can learn $f\approx1$ to keep a memory, so the product stays near 1. Two special cases: $f\approx1,\ i\approx0$ gives $c_t=c_{t-1}$ (memory frozen), and $f\approx0,\ i\approx1$ overwrites the memory.

Honest caveat: gates can saturate and gradients can still explode, which is why gradient clipping is still used. The activations do not fix vanishing gradients. The additive cell path and the forget gate do.

## Worked example

One scalar step ($H=I=1$). Inputs $x=1$, $h_{t-1}=0.5$, $c_{t-1}=0.4$. Each gate is $\sigma(w_x x+u\,h_{t-1}+b)$ with $(w_x,u,b)$: forget $(0.5,0.4,1.0)$, input $(0.6,0.2,0)$, candidate $(0.8,0.6,-0.1)$, output $(0.3,0.5,0)$.

Gates and candidate:

$$f_t=\sigma(0.5\cdot1+0.4\cdot0.5+1.0)=\sigma(1.7)=0.8455,\qquad i_t=\sigma(0.6+0.1)=\sigma(0.7)=0.6682$$

$$\tilde c_t=\tanh(0.8+0.3-0.1)=\tanh(1.0)=0.7616$$

Cell update:

$$c_t=0.8455\cdot0.4+0.6682\cdot0.7616=0.3382+0.5089=0.8471$$

Output:

$$o_t=\sigma(0.3+0.25)=\sigma(0.55)=0.6341,\qquad h_t=0.6341\cdot\tanh(0.8471)=0.6341\cdot0.6896=\boxed{0.4373}$$

Same step with a diagonal peephole weight of 0.5 on every gate: $f_t=\sigma(1.7+0.5\cdot0.4)=0.8699$, $i_t=\sigma(0.7+0.2)=0.7109$, so $c_t=0.8894$. The output gate uses this new cell: $o_t=\sigma(0.55+0.5\cdot0.8894)=0.7300$ and $h_t=0.5191$.

Parameter check: $I=10,\ H=20$ gives RNN 620, GRU 1860, LSTM 2480, and 2540 for a diagonal peephole LSTM. For $I=100,\ H=64$ an LSTM has $4\cdot64\cdot165=42240$.

## Exam corner

Asked in past exams. LSTM appeared in 3 to 4 past papers, with nearly identical wording. One Mid asks how LSTM fixes vanishing gradient using its gates, and another question in the same paper asks for the core difference between RNN, peephole LSTM and GRU, LSTM forget gate versus GRU reset gate, and the matrix workflow of an LSTM. A Final repeats that comparison form, and the syllabus for the Mid lists LSTM, GRU and BiLSTM under RNNs. Marks per part are not visible in the papers we have. Practice-set variants add parameter counts, peephole links, BiLSTM (outputs concatenated, size $2H$), stacked LSTM (layer $l+1$ reads layer $l$'s $h_t$), the shape of $h_T$ (a $(B,H)$ batch, unaffected by embedding size), and saturated gates (flat loss, near-zero gradients).

Marks come from:
- equations for all three gates and the candidate using $[h_{t-1},x_t]$
- the $c_t$ update and $h_t$
- a labelled diagram with the multiply on $c_{t-1}$
- one sentence tying the additive $c_t$ to the gradient

Common slips:
- Saying LSTM has "4 gates" including reset and update. That mixes in the GRU. It is 3 gates plus a candidate layer.
- Writing "LSTM uses sigmoid or tanh to solve vanishing gradient". The additive cell path and forget gate do.
- Drawing the forget gate without the multiply on $c_{t-1}$, or dropping $\tilde c_t$.
- Feeding $c_{t-1}$ to the peephole output gate. It sees $c_t$.
- Calling the output gate $r_t$. That letter is the GRU reset gate, so use $o_t$.

Cheat line: $c_t=f_t\odot c_{t-1}+i_t\odot\tilde c_t$, $h_t=o_t\odot\tanh c_t$, parameters $4H(H+I+1)$.

## Check yourself

<details>
<summary>1. With $f=1$, $i=0$ and $c_{t-1}=3$, what is $c_t$, and what is the memory doing?</summary>

$c_t=1\cdot3+0\cdot\tilde c_t=3$. The memory is frozen.
</details>

<details>
<summary>2. An LSTM has $I=10$ and $H=20$. How many parameters, and how many for a GRU of the same size?</summary>

LSTM $4\cdot20\cdot31=2480$. GRU $3\cdot20\cdot31=1860$, which is 75% of the LSTM.
</details>

<details>
<summary>3. Why does a task that copies a token 45 steps later favour an LSTM?</summary>

The direct cell path multiplies only forget gates, for example $0.99^{45}=0.636$. A vanilla RNN with a factor of 0.5 per step gives $0.5^{45}\approx2.8\times10^{-14}$.
</details>

## Read more

- [Understanding LSTM Networks](https://colah.github.io/posts/2015-08-Understanding-LSTMs/), the standard diagram walk-through.
- [Long Short-Term Memory in Dive into Deep Learning](https://d2l.ai/chapter_recurrent-modern/lstm.html), with code.
- [Long short-term memory on Wikipedia](https://en.wikipedia.org/wiki/Long_short-term_memory), including the peephole variant.

<!-- Reviewer notes: digest labels the forget pre-activation as sigma(1.5); recomputed value is sigma(1.7)=0.8455, used here. Original LSTM paper link (bioinf.jku.at) failed certificate check and was dropped. Marks per question not visible in sources. -->


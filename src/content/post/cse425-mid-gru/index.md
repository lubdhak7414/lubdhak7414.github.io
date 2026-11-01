---
title: "GRU and LSTM vs GRU"
description: "Write the four GRU equations from memory, say what each gate does, and compare the cell with an LSTM without mixing up the gates."
publishDate: '2026-11-02'
draft: true
tags: [neural-networks, cse425, rnn, gru, lstm]
series: "CSE 425 Mid"
part: 11
---

Ask a class which LSTM gate the GRU reset gate matches and a good half will say "forget". Past scripts say it too, and lose marks for it. The reset gate has no exact twin in an LSTM, and once you see where it acts, the confusion goes away.

## Quick idea

A GRU is an LSTM with the extras removed. There is no separate cell state, so the hidden state $h_t$ carries all the memory. There are two gates instead of three: an update gate and a reset gate.

The update gate decides how much of the old state to keep and how much of a fresh candidate to write in. The reset gate decides how much of the old state the candidate is allowed to see. Fewer gates means fewer weight matrices, so a GRU has 75% of the parameters of an LSTM of the same size, while still giving the gradient a clean path through time.

## Picture it

![GRU cell: the reset gate scales h_t-1 before it enters the tanh candidate, x_t enters unscaled, and the update gate blends the candidate with h_t-1; equations and worked-example values beside each gate](img/gru-gru-cell.svg)

*The reset gate touches only h_t-1, inside the candidate. The update gate then blends: 0.6682(0.7098) + 0.3318(0.5) = 0.6402.*

## The detail

Notation as in the series: $\sigma$ is the sigmoid, $\odot$ is the element-wise product, $x_t$ is the input at step $t$, $h_{t-1}$ the previous hidden state. The $W$ matrices act on the input, the $U$ matrices on the hidden state, and each block has a bias $b$.

$$z_t=\sigma(W_z x_t+U_z h_{t-1}+b_z),\qquad r_t=\sigma(W_r x_t+U_r h_{t-1}+b_r)$$

$$\tilde h_t=\tanh\big(W_h x_t+U_h (r_t\odot h_{t-1})+b_h\big)$$

$$h_t=z_t\odot\tilde h_t+(1-z_t)\odot h_{t-1}$$

Read them in that order. The gates $z_t$ and $r_t$ are vectors of numbers between 0 and 1. The candidate $\tilde h_t$ is a vanilla RNN step, except the old state is first scaled by $r_t$. If $r_t$ is 0, the candidate is built from $x_t$ alone. If it is 1, the candidate sees the full past. The reset multiplies $h_{t-1}$ only, never $x_t$.

The last line is a blend whose two weights add to 1. With $z_t\approx0$ the cell copies its old state, $h_t\approx h_{t-1}$. With $z_t\approx1$ it overwrites, $h_t\approx\tilde h_t$. This is the convention used in lecture. Some books and PyTorch swap the roles, $h_t=(1-z_t)\odot\tilde h_t+z_t\odot h_{t-1}$. Both are correct if you say which one you use, and a "$z$ near 0 or 1" question depends on it.

Every vector here has the same length. With a 5-dimensional input and 5-dimensional state, $W_z,W_r,W_h$ and $U_z,U_r,U_h$ are all $5\times5$, the biases are $5\times1$, and $z_t$, $r_t$, $\tilde h_t$, $h_t$ are all $5\times1$. The output $h_t$ becomes $h_{t-1}$ of the next cell, and the same equations repeat with $t+1$.

Why the gradient survives: $\partial h_t/\partial h_{t-1}$ contains the term $(1-z_t)$. When $z_t$ is near 0 that term is near 1, so the gradient passes back almost unchanged along an additive path. This is the same idea as the LSTM cell state.

Parameter counts, with $I$ inputs and $H$ hidden units, one bias per block: RNN $H(H+I)+H$, GRU three times that, LSTM four times.

| | LSTM | GRU |
|---|---|---|
| Gates | 3: forget, input, output | 2: update, reset |
| Separate cell state $c_t$ | yes | no, only $h_t$ |
| State blend | $c_t=f\odot c_{t-1}+i\odot\tilde c$, two independent gates | $h_t=z\odot\tilde h+(1-z)\odot h_{t-1}$, one gate, weights sum to 1 |
| Output gate | yes, $h_t=o\odot\tanh(c_t)$ | none, $h_t$ is exposed fully |
| Where the past is suppressed | forget gate scales the old cell state directly | reset gate scales the old state only inside the candidate |
| Weight blocks per step | 4 | 3 |
| Speed | slower | faster, fewer parameters |
| Variant | peephole: gates also see $c$ | none, there is no cell to peek at |

Gate mapping, the part that costs marks: the update gate is roughly forget plus input merged, with $1-z$ playing forget and $z$ playing input. It is not the output gate. The reset gate is not the forget gate, because forget acts on the memory itself while reset only changes what feeds the candidate.

## Worked example

Scalar case first, $H=1$: $z=0.5$, $h_{t-1}=2$, $\tilde h=0$. Then $h_t=0.5\cdot0+0.5\cdot2=1$. Same in either convention, since $z=0.5$.

Now a full step with $x=1$, $h_{t-1}=0.5$, and weights $(W,U,b)$ of $(0.5,0.4,0)$ for the update gate, $(0.3,0.2,0.1)$ for the reset gate, $(0.8,0.6,-0.1)$ for the candidate.

$z=\sigma(0.5+0.4\cdot0.5)=\sigma(0.7)=0.6682$

$r=\sigma(0.3+0.2\cdot0.5+0.1)=\sigma(0.5)=0.6225$

$\tilde h=\tanh(0.8+0.6\cdot0.6225\cdot0.5-0.1)=\tanh(0.8867)=0.7098$

$h_t=0.6682\cdot0.7098+(1-0.6682)\cdot0.5=0.4743+0.1659=0.6402$

$$\boxed{h_t\approx0.640}$$

Parameter counts for $I=10$, $H=20$: RNN $20\cdot30+20=620$, GRU $1860$, LSTM $2480$. For $I=100$, $H=64$: RNN 10560, GRU 31680, LSTM 42240.

## Exam corner

Asked in past exams: a gated-cell question appeared in 3 to 4 past papers, and the wording repeats almost word for word. Two Fall 2020 finals and a January 2022 sitting ask for the update and reset gates, the LSTM vs GRU workflow, and why a GRU is faster. One Mid paper (about November 2021) asks peephole-LSTM vs GRU, then update and reset gates with the workflow, then vanishing gradient with the LSTM gates. Another Fall 2020 final asks the core difference between RNN, peephole-LSTM and GRU, LSTM forget gate vs GRU reset gate, and the LSTM matrix workflow. Marks are not printed on the scans we have. The syllabus lists LSTM, GRU, BiLSTM and BiGRU under RNN as Mid topics.

Marks come from: drawing the cell with $x_t$ and $h_{t-1}$ in and $h_t$ out, the $z$ and $r$ equations with sigmoid, the candidate with the reset multiply, the blend for $h_t$, a statement that all dimensions match, and "no cell state, two gates".

On "why is a GRU faster than an RNN": the question is worded that way, but a GRU does more work per step than a plain RNN. Sample answers say fewer functions or no memory unit, which is true against an LSTM. The safest answer is that it is faster than an LSTM, and that against a plain RNN its gates give better gradient flow and quicker convergence in training.

Common slips:

- Calling the update gate the LSTM output gate. It is forget plus input.
- Calling the reset gate forget plus input, or simply forget.
- Saying a GRU has one activation function. It uses sigmoid and tanh.
- Swapping which of $W$ and $U$ goes with the input and which with the hidden state.

Formula line: $h_t=z_t\odot\tilde h_t+(1-z_t)\odot h_{t-1}$, $\tilde h_t=\tanh(W_hx_t+U_h(r_t\odot h_{t-1})+b_h)$, parameters $3[H(H+I)+H]$.

## Check yourself

1. $H=1$, $z=0.5$, $h_{t-1}=2$, $\tilde h=0$. What is $h_t$?
2. Which LSTM gates does the update gate combine, and which gate has no direct twin?
3. In the lecture convention, what does $z_t$ close to 0 do to $h_t$?

<details>
<summary>Answers</summary>

1. $h_t=0.5\cdot0+0.5\cdot2=1$.
2. Forget and input. The reset gate has no direct twin.
3. $h_t\approx h_{t-1}$, so the cell copies its old state and the gradient passes through almost unchanged.

</details>

## Read more

- [Gated Recurrent Units in Dive into Deep Learning](https://d2l.ai/chapter_recurrent-modern/gru.html), with code from scratch.
- [Understanding LSTM Networks](https://colah.github.io/posts/2015-08-Understanding-LSTMs/), the LSTM picture first, with a short section on the GRU variant.
- [Empirical Evaluation of Gated Recurrent Neural Networks on Sequence Modeling](https://arxiv.org/abs/1412.3555), the paper finding GRU comparable to LSTM.

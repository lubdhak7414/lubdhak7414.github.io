---
title: "CSE 425 Mid practice: worked neural network problems"
description: "Revision for the CSE 425 Mid: how to read a question, then thirteen worked problems on perceptrons, backprop, RNNs, LSTMs, GRUs and batch norm, answers checked."
publishDate: '2026-11-02'
draft: true
tags: [neural-networks, cse425, exam-prep, perceptron, backprop, rnn, lstm, gru]
series: "CSE 425"
section: "Mid"
part: 12
---

A function like $F = A \oplus C + BC'$ looks enough like XOR that it's tempting to draw an XOR network and move on. Without a truth table there's nothing to check the drawing against, and the rows it gets wrong stay hidden. Write the table first. It takes a minute, and then every row is something you can test.

This is revision for the whole Mid series: how to read a question, then thirteen worked patterns with fresh numbers, each pointing to the note that teaches the idea. They're practice problems, not copies of past papers, and they don't tell you what a paper will ask. Check what your own instructor expects.

> **Key Takeaways**
> - The command word (design, compare, derive, explain) sets how much working the answer needs.
> - The formula comes before the substitution, because a right formula with a wrong number is easy to fix.
> - For Boolean designs, list all the truth-table rows first and test the finished network on them.
> - Throughout the series $e=\widehat{y}-y$, $\delta=\partial L/\partial z$ and the update is $w\leftarrow w-\eta\,\delta\,a$.

## In the exam: reading a question

Spot the command word first, because it decides how much you write. "Design" wants inputs, weights, thresholds and one worked test. For "compare", give one named difference per row. A "derive" answer shows every chain-rule step, with the sum over the next layer where there is one, while "compute" only needs a formula, a substitution and a number. "Draw" means labelled boxes and arrows with the equations beside the parts they describe. "Explain why" is asking for the mechanism in two sentences; a definition won't get there.

The givens hold the small choices that change the answer. Check whether a step unit fires at $z>0$ or $z\ge0$, whether the error is $\widehat{y}-y$ or $y-\widehat{y}$, and which GRU convention is in use. If the question leaves it open, declare your choice and keep to it. Some course notes write $d$, $v$ and $\varphi$ for the target, pre-activation and activation function, and define $\delta$ as $-\partial E/\partial z$. The formulas below use the series notation, and the only visible difference is the sign of every $\delta$.

Then look for the stopping condition. A design question ends with a test, so run the network on a short input and write the outputs. A training question ends when a full pass makes no corrections, so that last clean pass belongs in the answer.

Write the formula down before any numbers, and start a Boolean question by listing all 8 rows (or 4, or 16) before you draw anything. A few facts are worth having ready: an LSTM has three gates plus a candidate, not four gates. Sigmoid and tanh on their own do not cure vanishing gradients. A GRU has two gates and no separate cell state. A one-hot vector has exactly one 1.

## Worked patterns

### 1. Counting separable functions

Taught in [Perceptron learning rule: AND by hand, and why not XOR](/blog/cse425-mid-perceptron/). Of the $2^{2^n}$ Boolean functions of $n$ inputs, the linearly separable ones number 4, 14, 104 and 1882 for $n = 1, 2, 3, 4$. That leaves 0, 2, 152 and 63,654 that no single unit can do. The count for $n = 5$ is the published value 94,572 ([A000609](https://oeis.org/A000609)). There is no simple formula.

### 2. A network for a Boolean function

Taught in [Perceptron learning rule: AND by hand, and why not XOR](/blog/cse425-mid-perceptron/) and [MLP forward pass by hand: XOR and activation functions](/blog/cse425-mid-mlp-activations/). The task is a network for $F = A \oplus C + BC'$. Rows 000 to 111 give $F = 0, 1, 1, 1, 1, 0, 1, 0$. Three hidden step units and an output are enough:

$$h_1 = [A - C > 0.5],\quad h_2 = [C - A > 0.5]$$

$$h_3 = [B - C > 0.5]$$

$$\text{output} = [h_1 + h_2 + h_3 > 0.5]$$

All 8 rows match. A single unit fails: $F = 0$ at 000 and 101 while $F = 1$ at 001 and 100, the same crossing pattern as XOR, because $000+101$ and $001+100$ give the same sum.

### 3. Picking the weights

Taught in [Perceptron learning rule: AND by hand, and why not XOR](/blog/cse425-mid-perceptron/). Three options are offered for OR on inputs 00, 01, 10, 11, with the unit firing at $z\ge0$. Option A (bias $-0.5$, weights 1, 1) gives outputs 0, 1, 1, 1, which is OR. Option B (bias 0.5, weights 1, 1) gives 1, 1, 1, 1. Option C (bias $-1$, weights 0.5, 0.5) gives 0, 0, 0, 1, which is AND. The answer is A.

Training OR from zero with $\eta = 1$ and a step at $z \ge 0$, in the order 00, 01, 10, 11, ends pass 1 with weights $(0,1)$ and bias 0, pass 2 with $(1,1)$ and bias 0, pass 3 with $(1,1)$ and bias $-1$, and pass 4 has no corrections.

### 4. The sigmoid derivative with a check

From [MLP forward pass by hand: XOR and activation functions](/blog/cse425-mid-mlp-activations/). With $\sigma = 1/(1 + e^{-z})$:

$$\sigma' = \frac{e^{-z}}{(1 + e^{-z})^2} = \sigma(1 - \sigma)$$

At $z = 0.7$, $\sigma = 0.6682$ and $\sigma' = 0.6682 \times 0.3318 = 0.2217$.

### 5. Deltas through a 2-2-2 network

Taught in [Backpropagation output layer delta, worked example](/blog/cse425-mid-backprop-output-layer/) and [Backpropagation worked example: hidden layer deltas](/blog/cse425-mid-backprop-hidden-layers/). All neurons are sigmoids with no biases, the loss is $L=\tfrac12\sum_k(\widehat y_k-y_k)^2$, $\mathbf x = (0.5, -1)$ and the targets are $\mathbf y = (1, 0)$. The first-layer weight rows are $(0.4, -0.3)$ and $(0.2, 0.6)$, and the second-layer rows are $(0.7, -0.5)$ and $(0.1, 0.9)$.

Forward: the hidden sums are $0.5$ and $-0.5$, so the hidden outputs are $h = (0.6225, 0.3775)$. The output sums are $0.2470$ and $0.4020$, so $\widehat{\mathbf y} = (0.5614, 0.5992)$.

Errors $e = \widehat{y} - y = (-0.4386,\ 0.5992)$ and slopes $\widehat{y}(1 - \widehat{y}) = (0.2462,\ 0.2402)$ give the output deltas

$$\delta_o = e\,\widehat{y}(1 - \widehat{y})$$

$$\delta_o=(-0.1080,\ 0.1439)$$

For hidden neuron 1, the weights into the two outputs are 0.7 and 0.1, the two products are $-0.1080\times0.7$ and $0.1439\times0.1$, and the sum is

$$\textstyle\sum_k\delta_kw_{k1}=-0.0756+0.0144$$

$$\textstyle\sum_k\delta_kw_{k1}=-0.0612$$

Hidden neuron 2 has weights $-0.5$ and $0.9$ and sum $0.1835$. Both hidden slopes are $0.6225 \times 0.3775 = 0.2350$, so

$$\delta_h = h(1 - h)\textstyle\sum_k\delta_kw_{kh}$$

$$\delta_h=(-0.01438,\ 0.04312)$$

For the first weight into hidden neuron 1:

$$\frac{\partial L}{\partial w_{11}} = \delta_{h1}\,x_1$$

$$\frac{\partial L}{\partial w_{11}} = -0.01438 \times 0.5 = -0.007191$$

A finite-difference nudge of that weight gives the same number, which is a good check that the deltas are right. With $\eta = 0.5$ the update is

$$w_{11} \leftarrow 0.4 - 0.5(-0.01438)(0.5)$$

$$= 0.4036$$

### 6. A computation graph

Take $f = (xy + \sin x)\,e^{y}$ at $x = 1$, $y = 2$ (see [Computation graph backpropagation, worked by hand](/blog/cse425-mid-computation-graphs/)). Forward: $t_3 = xy + \sin x = 2.8415$ and $e^{y} = 7.3891$, so $f = 20.996$. Backward: $\partial f/\partial x = (y + \cos x)\,e^{y} = 18.770$. The node $y$ feeds two paths, so you add them at the fork:

$$\frac{\partial f}{\partial y} = x\,e^{y} + t_3\,e^{y}$$

$$\frac{\partial f}{\partial y}=28.385$$

### 7. RNN design, a colour cycle

The colours are R, G, B, Y, and rainy weather moves to the next colour while dry weather keeps it. The input is a one-hot colour (4 values) and a one-hot weather (2 values). The design uses 8 hidden units $h_{c,w}=\mathrm{ReLU}(x_c+s_w-1)$, one per (colour, weather) pair, which give 1 only when both inputs are 1. Each one is wired to one output colour, and the output colour is fed back as the next input colour. All 8 pairs need checking. As a test, starting at R with weather rainy, rainy, dry, rainy, rainy, the outputs are G, B, B, Y, R. The design is from [RNN forward pass by hand: unrolling and parameter count](/blog/cse425-mid-rnn-basics/).

### 8. RNN size and a forward pass

Also from [the RNN note](/blog/cse425-mid-rnn-basics/). With input 6, hidden 8 and output 4, the parameter count is $HD + H^2 + H + VH + V$ with $H$ the hidden size, $D$ the input size and $V$ the output size:

$$48 + 64 + 8 + 32 + 4 = 156$$

A scalar tanh RNN with $W_{xh} = 0.5$, $W_{hh} = 0.8$, $b = 0.1$ and inputs $1, -1, 0.5$ starting from $h_0 = 0$ gives $h = 0.5370,\ 0.0296,\ 0.3572$. An output layer $2h_3 - 0.3$ then gives 0.4145.

### 9. One LSTM step and its size

Taught in [LSTM gates worked example: one step by hand](/blog/cse425-mid-lstm/). The step has $x = 1$, $h_{t-1} = 0.5$ and $c_{t-1} = 0.2$. The gate weights are listed as (input, hidden, bias): forget $(0.6, 0.4, 0.1)$, input $(0.5, -0.3, 0)$, output $(0.2, 0.7, -0.1)$ and candidate $(0.9, 0.5, 0.2)$. Then $f = 0.7109$, $i = 0.5866$, $o = 0.6106$ and $\tilde c = 0.8741$. The new cell and hidden state are

$$c_t = f c_{t-1} + i\tilde c$$

$$c_t = 0.1422 + 0.5127 = 0.6549$$

$$h_t = o\tanh c_t = 0.3511$$

Sizes with $D = 12$ and $H = 16$: an LSTM has $4(16 \cdot 28 + 16) = 1856$ parameters and a GRU $3(16 \cdot 28 + 16) = 1392$, which is 75% of the LSTM. [Understanding LSTM Networks](https://colah.github.io/posts/2015-08-Understanding-LSTMs/) has clear diagrams of each gate.

### 10. One GRU step

Taught in [GRU by hand: update and reset gates, LSTM vs GRU](/blog/cse425-mid-gru/). The convention is $h_t = (1 - z)\,h_{t-1} + z\,\tilde h$. The step has $x = -1$ and $h_{t-1} = 0.6$, with $z = \sigma(0.7x + 0.3h + 0.1)$, $r = \sigma(-0.4x + 0.8h)$ and $\tilde h = \tanh(1.1x + 0.5\,(r \odot h) - 0.2)$. Then $z = 0.3965$, $r = 0.7068$ and $\tilde h = -0.7961$:

$$h_t = 0.6035 \cdot 0.6 + 0.3965 \cdot (-0.7961)$$

$$h_t = 0.0464$$

### 11. Vanishing and exploding

Taught in [Backpropagation through time: a worked RNN example](/blog/cse425-mid-bptt/) and [the LSTM note](/blog/cse425-mid-lstm/). Ten sigmoid layers with unit weights, each passing at most 0.25 of the gradient, leave $0.25^{10} = 9.5 \times 10^{-7}$. A recurrent weight of 0.9 over 20 steps gives 0.1216, and 1.1 gives 6.727. An LSTM forget gate held at 0.95 for 20 steps still carries 0.3585 of the cell gradient, because $\partial c_t / \partial c_{t-1} = f_t$ on the direct path. Clipping fixes exploding only. The [recurrent networks chapter of d2l.ai](https://d2l.ai/chapter_recurrent-neural-networks/) covers BPTT and gradient clipping with code.

### 12. Batch normalisation

See [Batch normalisation by hand: training and test time](/blog/cse425-mid-batch-norm/). The batch is $(3, 5, 9, 15)$ and $\epsilon = 10^{-5}$. The mean is 8 and the variance is 21 (dividing by the batch size). The normalised values, written $\bar x$, are $(-1.0911, -0.6547, 0.2182, 1.5275)$. With $\gamma = 2$ and $\beta = -1$ the outputs $\gamma\bar x + \beta$ are $(-3.182, -2.309, -0.564, 2.055)$.

### 13. Activation derivatives

Taught in [MLP forward pass by hand: XOR and activation functions](/blog/cse425-mid-mlp-activations/). Values and derivatives at $z = -1.5$ and $z = 2$, with leaky ReLU using slope 0.1:

| Function | $f(-1.5)$ | $f(2)$ | $f'(-1.5)$ | $f'(2)$ |
|---|---|---|---|---|
| Sigmoid | 0.1824 | 0.8808 | 0.1491 | 0.1050 |
| Tanh | $-0.9051$ | 0.9640 | 0.1807 | 0.0707 |
| ReLU | 0 | 2 | 0 | 1 |
| Leaky ReLU (0.1) | $-0.15$ | 2 | 0.1 | 1 |

## Last-night checklist

Activations and deltas, with $e=\widehat{y}-y$:

$$\sigma'(z) = \sigma(1 - \sigma)$$

$$\tanh'(z) = 1 - \tanh^2 z$$

$$\mathrm{ReLU}'(z) = \mathbf{1}[z > 0]$$

$$\delta_o = e\,f'(z_o)$$

$$\delta_h = f'(z_h) \sum_k \delta_k w_{kh}$$

$$w \leftarrow w - \eta\,\delta\,a$$

Recurrent cells, with $\odot$ for elementwise product:

$$h_t = \tanh(W_{xh} x_t + W_{hh} h_{t-1} + b)$$

$$c_t = f \odot c_{t-1} + i \odot \tilde c$$

$$h_t = o \odot \tanh c_t$$

$$z = \sigma(W_z x + U_z h_{t-1} + b_z)$$

$$h_t = (1 - z) \odot h_{t-1} + z \odot \tilde h$$

Sizes, with input size $D$, hidden size $H$ and output size $V$: LSTM $4(H(D + H) + H)$, GRU $3(H(D + H) + H)$, and a plain RNN with an output layer $HD + H^2 + H + VH + V$. An LSTM has three gates plus a candidate. A GRU has two gates and no cell state.

Batch norm:

$$\bar x = \frac{x - \mu_B}{\sqrt{\sigma_B^2 + \epsilon}}$$

$$o = \gamma\bar x + \beta$$

Before handing in, I'd check four things: the truth table is written out, the step convention is stated, every fork has a sum, and every design ends with a test run.

## Practice: perceptron outputs, momentum and LSTM size

A perceptron has weights 1, 1 and bias $-0.5$, and fires at $z \ge 0$. What does it output at $(1, 0)$ and at $(0, 0)$?

<details><summary>Answer</summary>

At $(1, 0)$, $z = 0.5$, so the output is 1. At $(0, 0)$, $z = -0.5$, so the output is 0. It is OR.

</details>

Momentum with $\beta = 0.9$ and $\eta = 0.1$ keeps a velocity $u_{t+1} = \beta u_t + g_t$ and moves the weight by $-\eta\,u_{t+1}$. Start at $u = 0$ with gradients 2 and then 1. What is $u$ after step 2, and how far does the weight move in step 2?

<details><summary>Answer</summary>

$$u_1 = 2$$

$$u_2 = 0.9(2) + 1 = 2.8$$

The weight moves down by $0.1 \times 2.8 = 0.28$ in step 2.

</details>

How many parameters are in an LSTM layer with input size 5 and hidden size 8, one bias per block?

<details><summary>Answer</summary>

Each block has $8(5 + 8) + 8 = 112$. Four blocks give 448.

</details>

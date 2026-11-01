---
title: "Mid Exam Clinic"
description: "See which topics past Mid papers and quizzes actually asked, learn to read a question, and practise 15 question types with new numbers and checked answers."
publishDate: '2026-11-02'
draft: true
tags: [neural-networks, cse425, exam-prep, perceptron, backprop, rnn, lstm, gru]
series: "CSE 425 Mid"
part: 12
---

## Quick idea

Take the function $F = AB' + BA' + BC' + CB'$ and ask for a perceptron network with threshold 2. It sits in a 2021 Mid, in a 2021 quiz and in a Fall 2024 quiz. Students who call it "XOR" and draw a network without a truth table lose most of the marks.

This post tells you honestly what past papers asked and what they never touched, shows how to read a question, and gives you 15 question types with fresh numbers, checked answers and a link to the post that teaches each.

## Picture it

We could identify only two Mid papers, and they overlap: a 2021 online-form paper with five long questions, and a Fall 2021 paper where you answer any three of four. Their LSTM and GRU questions are nearly word for word the same. Everything else in the Mid folders was duplicate screenshots or student scripts of those two. Six quiz sets add more: three from 2021, two from Fall 2024 (before and after the Mid) and one set of typed solved quizzes. Marks are not printed on any scan, so do not budget time by marks from this post.

| Topic | Mids asking it (of 2) | Quiz sets asking it (of 6) | Typed practice items |
|---|---|---|---|
| Boolean function as a perceptron network | 2 | 2 | 10 |
| Counting separable functions | 1 | 0 | 1 |
| Sigmoid derivative, AND weights | 0 | 1 | 2 |
| Local gradient, delta | 1 | 2 | a few |
| RNN design with a test | 2 | 2 | about 10 |
| LSTM and GRU comparison, matrix workflow | 2 | 1 | about 20 |
| Vanishing gradient via the LSTM cell | 1 | 1 | 2 |
| Generalization vs overfitting | 1 | 0 | 1 |
| Computation graph | 0 | 2 | about 10 |
| Batch normalization | 0 | 1 | about 10 |
| Convolution size and node count | 0 | 2 | many |
| Kohonen best-matching unit | 0 | 1 | 0 |
| Optimization, dropout, regularization | 0 | 0 | practice only |
| Backpropagation through time | 0 | 0 | practice only |

Read the zeros carefully. No Mid or quiz we found asks a numeric BPTT unrolling, a GRU step, momentum or Adam, dropout, L1 or L2, or weight initialization. Those come only from the typed practice problems. They may still appear, but no paper proves it. Convolution and Kohonen show up in quizzes but belong to the [Final series](/blog/cse425-final-prerequisites/).

```mermaid
flowchart LR
    A["Read the question"] --> B["Find command word and givens"]
    B --> C["Write table or formula first"]
    C --> D["Substitute and box the answer"]
    D --> E["One line: what it means"]
```

## The detail

Every question hides three parts: a command word, the givens, and a stopping condition.

Command words decide how much you write. "Design" wants inputs, weights, thresholds and one worked test. "Compare" wants one named difference per row. "Derive" wants every chain-rule step with the sum over the next layer. "Explain why" wants a mechanism in two sentences.

Givens hold the traps. Check whether the step fires at $z > 0$ or $z \ge 0$, whether the error is $d - y$ or $y - d$, and which GRU convention you use. Declare it, and graders accept either.

The stopping condition costs marks. A design question ends with "show a test", so run the network on a short input and write the outputs. A size question ends when a stage becomes impossible, and the flatten size is only defined if every earlier stage worked.

Write the formula before you substitute, because a right formula with a wrong number still scores. For any Boolean question, list all 8 rows before you draw.

Slips that recur in scripts: calling an LSTM "four gates" (three gates and a candidate), saying sigmoid or tanh solves vanishing gradients, claiming a GRU uses one activation function, a one-hot input that sums to 2, and rounding 125/2 up to 63.

## Worked example

Fifteen question types follow, each with new numbers and the post to reread. Every answer was recomputed with code.

**1. Counting separable functions** ([The Perceptron](/blog/cse425-mid-perceptron/)). Of the $2^{2^n}$ Boolean functions of $n$ inputs, the linearly separable ones number 4, 14, 104 and 1882 for $n = 1, 2, 3, 4$. That leaves 0, 2, 152 and 63,654 that no single unit can do. The $n = 5$ count is a published 94,572 that we did not recompute. There is no simple formula.

**2. Network for a Boolean function** ([The Perceptron](/blog/cse425-mid-perceptron/), [MLPs](/blog/cse425-mid-mlp-activations/)). Design for $F = A \oplus C + BC'$. Rows 000 to 111 give $F = 0, 1, 1, 1, 1, 0, 1, 0$. Use three hidden step units $h_1 = [A - C > 0.5]$, $h_2 = [C - A > 0.5]$, $h_3 = [B - C > 0.5]$ and an output $[h_1 + h_2 + h_3 > 0.5]$. All 8 rows match. A single unit fails: $F = 0$ at 000 and 101 while $F = 1$ at 001 and 100, the same crossing pattern as XOR. State "one unit cannot, two layers can" and show the table.

**3. Pick the weights** ([The Perceptron](/blog/cse425-mid-perceptron/)). Three options for OR on inputs 00, 01, 10, 11. Option A (bias -0.5, weights 1, 1) gives outputs 0, 1, 1, 1, which is OR. Option B (bias 0.5, weights 1, 1) gives 1, 1, 1, 1. Option C (bias -1, weights 0.5, 0.5) gives 0, 0, 0, 1, which is AND. Answer A. Training OR from zero with $\eta = 1$ and step at $z \ge 0$, in the order 00, 01, 10, 11, gives weights $(0,1)$, then $(1,1)$, then $(1,1)$ with bias -1, and epoch 4 has no errors.

**4. Sigmoid derivative with a check** ([MLPs and Activations](/blog/cse425-mid-mlp-activations/)). Proof: $\sigma = 1/(1 + e^{-v})$ gives $\sigma' = e^{-v}/(1 + e^{-v})^2 = \sigma(1 - \sigma)$. At $v = 0.7$, $\sigma = 0.6682$ and $\sigma' = 0.6682 \cdot 0.3318 =$ **0.2217**.

**5. Delta backprop** ([Part 1](/blog/cse425-mid-backprop-output-layer/), [Part 2](/blog/cse425-mid-backprop-hidden-layers/)). A 2-2-2 sigmoid network, $x = (0.5, -1)$, first-layer weights rows $(0.4, -0.3)$ and $(0.2, 0.6)$, second-layer rows $(0.7, -0.5)$ and $(0.1, 0.9)$, targets $d = (1, 0)$, no biases. Hidden outputs 0.6225 and 0.3775, outputs 0.5614 and 0.5992. Output deltas $\delta_o = (d - y)\,y(1 - y) = $ **(0.1080, -0.1439)**. Hidden deltas $\delta_h = h(1 - h) \sum_k \delta_k w_{kh} = $ **(0.01438, -0.04312)**. Gradient check: $\partial E/\partial w_{11} = -\delta_{h1} x_1 = -0.007191$, matching a finite difference. With $\eta = 0.5$, $w_{11} \to 0.4 + 0.5 \cdot 0.01438 \cdot 0.5 =$ **0.4036**.

**6. Computation graph** ([Computation Graphs](/blog/cse425-mid-computation-graphs/)). $f = (xy + \sin x)\,e^{y}$ at $x = 1$, $y = 2$. Forward: $t_3 = xy + \sin x = 2.8415$, $e^{y} = 7.3891$, $f =$ **20.996**. Backward: $\partial f/\partial x = (y + \cos x)\,e^{y} =$ **18.770**. For $y$ the node feeds two paths, so you add them at the fork: $\partial f/\partial y = x\,e^{y} + t_3\,e^{y} =$ **28.385**.

**7. RNN design, cloth colours** ([RNN Basics](/blog/cse425-mid-rnn-basics/)). Colours R, G, B, Y. Rainy weather moves to the next colour, dry keeps it. Input a one-hot colour (4 values) and a one-hot weather (2 values). Use 8 AND units with threshold 2, one per (colour, weather) pair, each wired to one output colour, and feed the output colour back as the next state. Check all 8 pairs. Test: start R with weather rainy, rainy, dry, rainy, rainy. The outputs are **G, B, B, Y, R**.

**8. RNN size and a forward pass** ([RNN Basics](/blog/cse425-mid-rnn-basics/)). Input 6, hidden 8, output 4: $HI + H^2 + H + OH + O = 48 + 64 + 8 + 32 + 4 =$ **156** parameters. Scalar RNN with $W_{xh} = 0.5$, $W_{hh} = 0.8$, $b = 0.1$, inputs $1, -1, 0.5$, from $h_0 = 0$: $h = 0.5370,\ 0.0296,\ 0.3572$. An output layer $2h_3 - 0.3$ gives **0.4145**.

**9. One LSTM step and its size** ([LSTM](/blog/cse425-mid-lstm/)). $x = 1$, $h_{t-1} = 0.5$, $c_{t-1} = 0.2$. Gate weights as (input, hidden, bias): forget $(0.6, 0.4, 0.1)$, input $(0.5, -0.3, 0)$, output $(0.2, 0.7, -0.1)$, candidate $(0.9, 0.5, 0.2)$. Then $f = 0.7109$, $i = 0.5866$, $o = 0.6106$, $g = 0.8741$. Cell $c_t = f c_{t-1} + i g = 0.1422 + 0.5127 =$ **0.6549**, and $h_t = o \tanh c_t =$ **0.3511**. Sizes with $I = 12$, $H = 16$: LSTM $4(16 \cdot 28 + 16) =$ **1856**, GRU $3(16 \cdot 28 + 16) =$ **1392**, which is 75% of the LSTM.

**10. One GRU step** ([GRU](/blog/cse425-mid-gru/)). Convention $h_t = (1 - z)\,h_{t-1} + z\,\tilde{h}$. $x = -1$, $h_{t-1} = 0.6$, with $z = \sigma(0.7x + 0.3h + 0.1)$, $r = \sigma(-0.4x + 0.8h)$, $\tilde{h} = \tanh(1.1x + 0.5\,(r \odot h) - 0.2)$. Then $z = 0.3965$, $r = 0.7068$, $\tilde{h} = -0.7961$, and $h_t = 0.6035 \cdot 0.6 + 0.3965 \cdot (-0.7961) =$ **0.0464**.

**11. Vanishing and exploding** ([BPTT](/blog/cse425-mid-bptt/), [LSTM](/blog/cse425-mid-lstm/)). Ten sigmoid layers, each passing at most 0.25 of the gradient: $0.25^{10} = 9.5 \times 10^{-7}$. A recurrent weight of 0.9 over 20 steps gives 0.1216, and 1.1 gives 6.727. An LSTM forget gate held at 0.95 for 20 steps still carries 0.3585 of the cell gradient, because $\partial c_t / \partial c_{t-1} = f_t$ on the direct path. Clipping fixes exploding only.

**12. Batch normalization** ([Batch Norm](/blog/cse425-mid-batch-norm/)). Batch $(3, 5, 9, 15)$, $\epsilon = 10^{-5}$. Mean 8, variance 21 (divide by $m$). Normalized values $(-1.0911, -0.6547, 0.2182, 1.5275)$. With $\gamma = 2$ and $\beta = -1$: $y =$ **(-3.182, -2.309, -0.564, 2.055)**.

**13. Activation derivatives** ([MLPs and Activations](/blog/cse425-mid-mlp-activations/)). At $z = -1.5$ and $z = 2$:

| Function | Value at -1.5 | Value at 2 | Derivative at -1.5 | Derivative at 2 |
|---|---|---|---|---|
| Sigmoid | 0.1824 | 0.8808 | 0.1491 | 0.1050 |
| Tanh | -0.9051 | 0.9640 | 0.1807 | 0.0707 |
| ReLU | 0 | 2 | 0 | 1 |
| Leaky ReLU, slope 0.1 | -0.15 | 2 | 0.1 | 1 |

**14. Node count and padded convolution** ([CNN Basics in the Final series](/blog/cse425-final-cnn-basics/)). A 512x512 input, five 6x6 filters, stride 2, no padding, then 2x2 pooling, repeated. The maps go 254 then 127, 61 then 30, 13 then 6. Flatten $5 \cdot 6 \cdot 6 =$ **180**. A fourth set gives 1 then pooling gives 0, which is impossible, so say it. For the padded convolution, take a 4x4 matrix with rows $(1,3,4,2)$, $(2,5,6,3)$, $(4,5,6,3)$, $(5,2,5,3)$, one zero of padding, and a 3x3 filter whose every row is $(1, 0, 0)$. Each output copies its left neighbour, so the rows are $(0,3,8,10)$, $(0,7,13,16)$, $(0,11,12,17)$, $(0,9,7,11)$.

**15. Kohonen best-matching unit** ([Kohonen SOM in the Final series](/blog/cse425-final-kohonen-som/)). A 3x3 grid with weights by row: $(0.2,0.7)$, $(0.5,0.1)$, $(0.9,0.3)$; $(0.4,0.4)$, $(0.6,0.8)$, $(0.1,0.2)$; $(0.7,0.5)$, $(0.3,0.9)$, $(0.8,0.6)$. Input $(0.5, 0.45)$. The nearest unit is row 1, column 0 at $(0.4, 0.4)$, distance **0.1118**. With $\eta = 0.5$ it moves to **(0.45, 0.425)**.

## Exam corner

Asked in past exams. Boolean function as a perceptron network appeared in both Mids and 2 of 6 quiz sets. RNN design with a worked test appeared in both Mids and 2 quiz sets. LSTM and GRU comparison with a matrix workflow appeared in both Mids and 1 quiz set. Vanishing gradient through the LSTM cell appeared in 1 Mid and 1 quiz set. Local gradient or delta questions appeared in 1 Mid (as signal flow) and 2 quiz sets. Computation graphs appeared in 2 quiz sets and no Mid. Counting separable functions and generalization vs overfitting appeared once each. Optimization, dropout, regularization and BPTT appeared in 0 papers.

Marks come from. Design: the truth table, weights that satisfy every row, one test run. Compare: one named difference per row, forget vs reset kept straight. Derivations: each chain-rule step, the sum, the sign. Numbers: formula, substitution, boxed result.

Common slips. A weight set that fails one row. Skipping the fork sum in a graph. Dropping the sum or minus sign in a hidden delta.

Formula cheat line. $\sigma' = \sigma(1 - \sigma)$.

## Last-night checklist

Activations and deltas:

$$\sigma'(z) = \sigma(1 - \sigma), \quad \tanh'(z) = 1 - \tanh^2 z, \quad \mathrm{ReLU}'(z) = \mathbf{1}[z > 0]$$

$$\delta_o = (d - y)\,\varphi'(v_o), \quad \delta_h = \varphi'(v_h) \sum_k \delta_k w_{kh}, \quad \Delta w_{ji} = \eta\,\delta_j\,y_i$$

Recurrent cells, with $\odot$ for elementwise product:

$$h_t = \tanh(W_{xh} x_t + W_{hh} h_{t-1} + b), \quad c_t = f \odot c_{t-1} + i \odot g, \quad h_t = o \odot \tanh c_t$$

$$z = \sigma(W_z x + U_z h_{t-1} + b_z), \quad h_t = (1 - z) \odot h_{t-1} + z \odot \tilde{h}$$

Sizes: LSTM $4(H(I + H) + H)$, GRU $3(H(I + H) + H)$, plain RNN with output $HI + H^2 + H + OH + O$. LSTM has three gates plus a candidate. GRU has two gates and no cell state.

Batch norm and size:

$$\hat{x} = \frac{x - \mu}{\sqrt{\sigma^2 + \epsilon}}, \quad y = \gamma \hat{x} + \beta, \qquad n' = \left\lfloor \frac{n + 2p - k}{s} \right\rfloor + 1$$

Habits: truth table first, state your step convention, sum at every fork, floor every division, finish a design with a test run.

## Check yourself

<details>
<summary>1. A perceptron has weights 1, 1 and bias -0.5, firing at $z \ge 0$. What does it output at (1, 0) and (0, 0)?</summary>
At (1, 0), $z = 0.5$, so output 1. At (0, 0), $z = -0.5$, so output 0. It is OR.
</details>

<details>
<summary>2. Momentum with $\beta = 0.9$, $\eta = 0.1$, $v \leftarrow \beta v - \eta g$, starting at $v = 0$. Gradients 2 then 1. What is $v$ after step 2?</summary>
$v_1 = -0.2$. $v_2 = 0.9(-0.2) - 0.1(1) = -0.28$. This topic has no past paper, so treat it as practice-set material.
</details>

<details>
<summary>3. How many parameters in an LSTM layer with input size 5, hidden size 8, one bias per block?</summary>
Each block has $8(5 + 8) + 8 = 112$. Four blocks give 448.
</details>

## Read more

- [Understanding LSTM Networks by Colah](https://colah.github.io/posts/2015-08-Understanding-LSTMs/), the clearest gate diagrams, with a short GRU section.
- [Dive into Deep Learning, recurrent neural networks chapter](https://d2l.ai/chapter_recurrent-neural-networks/), for sizes, BPTT and gradient clipping.

<!-- Reviewer note: marks not visible in scans. Only two Mids identifiable. n = 5 separable count cited, not recomputed. Semester labels partly legible. External links not fetched; verify. -->

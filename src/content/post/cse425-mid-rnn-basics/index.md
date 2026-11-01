---
title: "RNN Basics: Unrolling Through Time"
description: "Write the RNN forward pass with correct shapes, draw it unrolled, count its parameters, and design a small hand-built RNN."
publishDate: '2026-11-02'
draft: true
tags: [neural-networks, cse425, rnn]
series: "CSE 425 Mid"
part: 8
---

## Quick idea

Give an MLP the numbers 5, 10, 15, 20 one at a time and ask for the next one. It sees 20, alone, and has no idea what came before. Same problem with "I moved to France years ago, so I need to speak ___": the answer depends on a word far back in the sentence.

A recurrent network fixes this by feeding its own previous output, the hidden state, back in as an extra input at the next step. The hidden state is the network's memory of everything so far, squeezed into $H$ numbers.

The part students miss: there is only one set of weights. The same matrices are reused at every time step. That is why a 50-step sequence costs no more parameters than a 5-step one, and why the exam loves asking you to count them.

## Picture it

The loop on the left is the real network. The chain on the right is the same network drawn once per time step, which is what unrolling means.

![A rolled RNN cell with a W_hh self-loop beside three unrolled copies; every copy uses the same W_xh (2 x 3), W_hh (2 x 2) and W_hy (2 x 2), with the hidden states from the worked example](img/rnn-basics-rnn-unrolled-shapes.svg)

*Unrolling draws one copy per step, but every copy uses the same three matrices, so the count stays at 18 parameters whatever T is.*

## The detail

Use column vectors. At step $t$ the input is $\mathbf{x}_t\in\mathbb{R}^D$, the hidden state is $\mathbf{h}_t\in\mathbb{R}^H$, and the output is $\mathbf{y}_t\in\mathbb{R}^V$. The hidden state starts at zero.

$$\mathbf{z}_t = W_{xh}\mathbf{x}_t + W_{hh}\mathbf{h}_{t-1} + \mathbf{b}_h,\qquad \mathbf{h}_t=\tanh(\mathbf{z}_t),\qquad \mathbf{h}_0=\mathbf{0}$$

$$\mathbf{o}_t = W_{hy}\mathbf{h}_t+\mathbf{b}_y,\qquad \hat{\mathbf{y}}_t=\mathrm{softmax}(\mathbf{o}_t),\qquad L=\sum_{t=1}^{T}L_t$$

Here $L_t$ is the loss at step $t$ (cross-entropy against the target for that step) and $L$ is their sum. Some slides use the row-vector form $\mathbf{x}_tW_x+\mathbf{h}_{t-1}W_h$, where every matrix is the transpose of the one above, so the sizes are $D\times H$ and $H\times H$. Both forms are correct. Pick one, say which, and keep it for the whole answer.

**Shapes.** This is where marks leak. $W_{xh}$ is $H\times D$, $W_{hh}$ is $H\times H$, $W_{hy}$ is $V\times H$, $\mathbf{b}_h$ has $H$ entries and $\mathbf{b}_y$ has $V$. The sum works because

$$(H\times D)(D\times 1)+(H\times H)(H\times 1)=H\times 1.$$

In Keras-style libraries the data tensor is (batch, time steps, features), so one training batch has a time axis that an MLP never had.

**Parameter sharing.** Unrolling draws $T$ copies of the cell, but every copy uses the same $W_{xh}$, $W_{hh}$, $W_{hy}$ and biases. Count them once:

$$HD + H^2 + H + VH + V.$$

There is no $T$ in that formula. A question that gives you $T=50$ and asks for the parameter count is handing you a distractor.

**One-hot inputs.** When the inputs are categories (a colour, a weather, a character), encode each as a vector with a single 1. If the categories are $e_1,e_2,e_3$ then $W_{xh}\mathbf{e}_k$ is just column $k$ of $W_{xh}$. So the input matrix is a lookup table: each column holds what that category does to the hidden state. A one-hot vector stops being one-hot the moment you add two of them (you get a 2 somewhere), so any design that adds one-hot vectors needs a step that cleans the result back up.

**Input and output types.** The same cell fits several tasks. One-to-many: image captioning, one input and a sequence out. Many-to-one: sentiment, a sentence in and one label from the last hidden state. Many-to-many: translation or labelling every step, with a loss at every $t$.

**Building a matrix from a graph.** For hand-built RNNs you draw which unit feeds which, then write the matrix. If you write rows as "from" and columns as "to" while drawing, the matrix that multiplies a column vector is the transpose of what you wrote. Forgetting that transpose is the most common wrong-orientation error.

## Worked example

Take $D=3$ with inputs $\mathbf{e}_1,\mathbf{e}_2,\mathbf{e}_3$ at $t=1,2,3$, $H=2$, $V=2$.

$$W_{xh}=\begin{pmatrix}0.5&-0.3&0.2\\0.1&0.4&-0.6\end{pmatrix},\ W_{hh}=\begin{pmatrix}0.3&-0.2\\0.1&0.5\end{pmatrix},\ \mathbf{b}_h=\begin{pmatrix}0.1\\-0.1\end{pmatrix},\ W_{hy}=\begin{pmatrix}1&-1\\0.5&0.5\end{pmatrix},\ \mathbf{b}_y=\mathbf{0}.$$

Step 1. $W_{hh}\mathbf{h}_0=\mathbf{0}$, and $W_{xh}\mathbf{e}_1$ is column 1, so $\mathbf{z}_1=(0.5,0.1)+(0.1,-0.1)=(0.6,0)$ and $\mathbf{h}_1=(\tanh 0.6,\tanh 0)=(0.5370,\,0)$.

Step 2. $W_{hh}\mathbf{h}_1=(0.1611,\,0.0537)$ and column 2 is $(-0.3,0.4)$, so $\mathbf{z}_2=(-0.3+0.1611+0.1,\ 0.4+0.0537-0.1)=(-0.0389,\,0.3537)$. Then $\mathbf{h}_2=(-0.0389,\,0.3397)$.

Step 3. $W_{hh}\mathbf{h}_2=(-0.0796,\,0.1660)$ and column 3 is $(0.2,-0.6)$, so $\mathbf{z}_3=(0.2204,\,-0.5341)$ and $\mathbf{h}_3=(0.2169,\,-0.4885)$.

Output at $t=3$: $\mathbf{o}_3=W_{hy}\mathbf{h}_3=(0.2169+0.4885,\ 0.1085-0.2443)=(0.7054,\,-0.1358)$. Softmax gives $\hat{\mathbf{y}}_3=(0.6987,\,0.3013)$.

Parameters: $HD+H^2+H+VH+V=6+4+2+4+2=18$.

Final answer: $\mathbf{h}_3=(0.2169,-0.4885)$, $\hat{\mathbf{y}}_3=(0.6987,0.3013)$, 18 parameters.

## Exam corner

**Asked in past exams.** The design question is the repeat offender. It appeared in one of the Mid papers we have (Spring 2021, a gym-equipment scenario with colour brightness as input and "show the necessary calculations") and in one quiz (weather of sunny or windy, four cloth colours, one-hot vectors, test the case "sunny and wearing pink"). The same cloth and gym questions turn up again in later RNN practice sets. The lecturer also said at least one RNN question will appear in the mid, the final and the quizzes. The practice set has ten RNN items (update equation, unrolling, exploding gradients, parameter count, long-range problems, teacher forcing, many-to-one versus many-to-many); no official solutions exist for them, so treat the numbers below as recomputed, not copied.

**Design recipe (cloth colours).** Rule in the quiz as I read the scan, partly legible, so check yours: sunny moves to the next colour in the cycle B, g, P, W, back to B; windy keeps the same colour.

1. Inputs: colour one-hot (4 entries) and weather one-hot (2 entries), so $D=6$.
2. Hidden layer: 8 AND units, one per (colour, weather) pair, $h_{c,w}=\mathrm{ReLU}(x_c+s_w-1)$. It is 1 only when both inputs are 1, otherwise 0.
3. Output: colour $c'$ gets the windy unit of $c$ plus the sunny unit of the colour before $c'$ in the cycle. Each output is 0 or 1, so the result is already one-hot with no clean-up.
4. Test: pink (P) and sunny. $x_P=1$, $s_{sunny}=1$ gives $h_{P,sunny}=1$, every other unit 0. That unit feeds output W. Answer: white.

Same method for the food version from lecture: foods chicken, burger, pizza, ice cream; sunny means same food, rainy means next. Start with chicken and the weather rainy, rainy, sunny, rainy, rainy: burger, pizza, pizza, ice cream, chicken. Hidden widths are colours times weathers: $4\times2=8$, $3\times2=6$, $4\times3=12$.

A second hand-built pattern: detect two 1s in a row with $h_t=\mathrm{ReLU}(x_t+x_{t-1}-1)$. Input 0,1,1,0,1,1,1,0 gives 0,0,1,0,0,1,1,0. Three in a row needs $\mathrm{ReLU}(x_t+x_{t-1}+x_{t-2}-2)$, so the state must remember two past inputs; the same input gives 0,0,0,0,0,0,1,0.

**Marks come from.** Naming the input and output vectors and their sizes; writing the weight matrices with correct orientation; showing the hidden activations; running one specific test sequence through step by step.

**Common slips.** Wrong matrix orientation (the transpose). Different weights at each time step. A summed one-hot vector with a 2 in it left uncleaned. No worked test input at the end. Counting $T$ in the parameter count.

**Practice item, char model.** $H=128$, $V=27$, $T=50$: $W_{hh}=128^2=16384$, $W_{hy}=27\cdot128=3456$, together 19,840. If the input is also one-hot over 27 characters, add $W_{xh}=3456$ and biases $128+27=155$ for 23,451 in total. $T$ plays no part.

**Cheat line.** $\mathbf{h}_t=\tanh(W_{xh}\mathbf{x}_t+W_{hh}\mathbf{h}_{t-1}+\mathbf{b}_h)$; params $HD+H^2+H+VH+V$; same weights every step.

## Check yourself

<details>
<summary>1. With $D=10$, $H=20$, $V=5$ and $T=100$, how many parameters?</summary>

$20\cdot10+400+20+5\cdot20+5=200+400+20+100+5=725$. $T$ does not appear.
</details>

<details>
<summary>2. Why is $W_{hh}$ square?</summary>

It maps the $H$-entry hidden state to a new $H$-entry hidden state, so it is $H\times H$. That is also what lets the output of one step become the input of the next.
</details>

<details>
<summary>3. A one-hot input $\mathbf{e}_2$ is multiplied by $W_{xh}$. What do you get?</summary>

Column 2 of $W_{xh}$.
</details>

## Read more

- [d2l.ai chapter on recurrent neural networks](https://d2l.ai/chapter_recurrent-neural-networks/rnn.html), hidden states and shared parameters with code.
- [Karpathy on the effectiveness of recurrent networks](https://karpathy.github.io/2015/05/21/rnn-effectiveness/), the one-to-many, many-to-one and many-to-many patterns with examples.

<!-- For reviewer: the digest says the cloth-quiz colour rule and the windy table are partly legible; the post hedges accordingly. The hidden-width remarks in the lecture were garbled, so the 8/6/12 widths are recomputed. Practice items 21 to 30 have no official solutions. -->

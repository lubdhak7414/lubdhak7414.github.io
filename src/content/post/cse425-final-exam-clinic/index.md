---
title: "Final Exam Clinic"
description: "See which topics past Finals actually asked, learn to read a question, and practise 15 question types with new numbers and checked answers."
publishDate: '2026-11-02'
draft: true
tags: [neural-networks, cse425, exam-prep, cnn, vae, attention]
series: "CSE 425 Final"
part: 10
---

## Quick idea

Pick a 128x128 image, run five conv-pool stages, and ask for the size at the end. Two of the past Final papers contain a question built exactly like this, and both hide the same trap: the feature map gets smaller than the kernel before the stages run out. Students who calculate mechanically write a negative size and move on. The answer that earns marks is "stage 5 is impossible without padding".

This post is the last one in the series. It does three jobs. It tells you honestly what past papers asked and what they did not. It shows how to read a question so you collect every mark on offer. And it gives you 15 question types with fresh numbers, checked answers and a link back to the post that teaches each one.

## Picture it

Here is how often each topic showed up. We could identify three past Final sittings: two sets of the same Fall 2020 paper and one January 2022 sitting that repeats three of the same questions. Everything else we found was a copy of those. Each paper has a five-item true/false block plus four long questions. Marks per question are not printed in the scans we have, so do not budget time by marks from this post.

| Topic | Past sittings that asked it (of 3) | Items in the typed practice set | Marks in a mock question set |
|---|---|---|---|
| CNN shared weights, edge filter design | 3 | about 6 | 0 |
| Gated RNN comparison (GRU, LSTM) | 3 | 0 | 0 |
| CNN tensor-size arithmetic | 2 | about 32 | 5 |
| Backprop delta derivation | 2 | 0 | 0 |
| True/false on CNN concepts | 2 (both Fall 2020 sets) | 0 | 0 |
| Separability with a 1D conv | 1 | 0 | 0 |
| Pooling vs strided conv | 0 (one true/false touches pooling) | 1 | 4 |
| VAE: KL, ELBO, reparameterization | 0 | about 33 | 18 |
| Attention, positional encoding | 0 | about 37 | 10 |

Read the zeros carefully. No past Final we have contains a VAE, autoencoder or attention question. Their weight in your revision comes from the typed practice set and the mock question set, which are written in the style of the current course. The practice set has 104 problems: about 25 on CNNs, 25 on VAEs, 26 on attention, the rest mixed. Whether the real exam leans on VAE and Transformer is unconfirmed. Treat the past papers as proof of the question style for CNNs and gated cells, and the practice set as the best guess for everything else.

```mermaid
flowchart LR
    A["Read the question"] --> B["Find the topic and its formula"]
    B --> C["Write formula, then substitute"]
    C --> D["Box the answer"]
    D --> E["One line: what it means"]
```

## The detail

How to read a past-paper question. Every question has three parts hiding in it: a command word, the givens, and a stopping condition.

Command words decide how much you write. "Compute" wants a formula, a substitution and a boxed number. "Compare" wants a table or two parallel paragraphs naming at least one difference per row. "Derive" wants every chain-rule step with the sum over the next layer visible. "Draw" wants labelled boxes and arrows, and the gate equations beside the gates. "Explain why" wants a mechanism in two sentences, not a definition.

Givens are where the arithmetic traps live. Check whether padding is stated, whether the stride applies to the pool as well as the conv, whether biases are counted, and whether the GRU or LSTM convention is declared. When two conventions exist (for example the GRU update gate can multiply the old state or the candidate), say which you use. Graders accept either if you declare it.

The stopping condition is the one that costs marks. A "repeat until" question expects you to notice when a stage becomes impossible. A flatten size is only defined if every stage before it worked.

Two habits that pay off on every numeric question. First, write the formula before substituting, because a wrong number with a right formula still scores. Second, floor every division in the size formula:

$$n' = \left\lfloor \frac{n + 2p - k}{s} \right\rfloor + 1$$

A common slip is rounding 62.5 up to 63. The chain starting at 128 with a 5x5 kernel, stride 2 and no padding goes 62, then pooling gives 31, and that is correct only because 62.5 was floored to 62.

Other slips that show up repeatedly: forgetting that a failed stage makes the flatten size undefined, confusing the GRU reset gate with the LSTM forget gate, writing the second derivative of the activation where the first derivative belongs in a hidden-layer delta, dropping the minus sign when differentiating the error with respect to a hidden output, and mixing up the two KL terms in a VAE.

## Worked example

Fifteen question types follow. Each has new numbers, the working in brief, and the post to reread. Every answer was recomputed with code.

**1. Output size** ([CNN Basics](/blog/cse425-final-cnn-basics/)). Input 45, kernel 7, stride 2, padding 3. Then $n' = \lfloor (45 + 6 - 7)/2 \rfloor + 1 = \lfloor 22 \rfloor + 1 =$ **23**.

**2. Conv-pool trace until it breaks** ([CNN Part 2](/blog/cse425-final-cnn-pooling-architectures/)). Input 100x100x1, eight 5x5 filters, stride 1, no padding, then 2x2 pooling with stride 2, repeated. The maps go 96 then 48, 44 then 22, 18 then 9, 5 then 2. A fifth 5x5 conv on a 2x2 map fails. So four stages work, and the flatten size is $8 \cdot 2 \cdot 2 =$ **32**. Say that a fifth stage is impossible without padding.

**3. Parameter count** ([CNN Basics](/blog/cse425-final-cnn-basics/)). A 3x3 conv from 3 channels to 20 filters with bias has $20(3 \cdot 3 \cdot 3 + 1) =$ **560** parameters. A dense layer from 20 to 40 units with bias has $40(20 + 1) =$ **840**.

**4. Edge filter by hand** ([CNN Basics](/blog/cse425-final-cnn-basics/)). Every row of a 6x6 image reads 8 8 8 2 2 2. The filter has rows (1, 0, -1) in all three rows. One output row: slide across, multiply and add. Window 1 gives 3(8 - 8) = 0, window 2 gives 3(8 - 2) = 18, window 3 gives 18, window 4 gives 0. Output row **0, 18, 18, 0**. The flipped filter gives 0, -18, -18, 0, and after ReLU only the first filter responds. The 18s sit where light turns to dark.

**5. Can one conv layer separate translated patterns?** ([CNN Part 2](/blog/cse425-final-cnn-pooling-architectures/)). Past question: a 1D conv, then a linear layer, then a logistic output, asked to separate every shifted copy of two bar patterns. Reasoning answer: with no nonlinearity in between, the whole stack collapses into one linear score on the input. Average that score over all wrap-around shifts of a pattern with $m$ black cells and you get a value that depends only on $m$. So two patterns with the same $m$ cannot be separated, and two with different $m$ can be separated by their count.

**6. Why sharing helps** ([CNN Basics](/blog/cse425-final-cnn-basics/)). A 32x32 input to a fully connected layer of 1024 units has $1024 \cdot (1024 + 1) =$ **1,049,600** parameters. One 3x3 filter with bias has 10, and sixteen of them have **160**. Same image, about 6,500 times fewer weights, and the filter works at every position.

**7. Gated cells** ([LSTM](/blog/cse425-mid-lstm/) and [GRU](/blog/cse425-mid-gru/)). Input size 10, hidden size 20. An LSTM has four weight blocks, each with $20(10 + 20) + 20$ parameters, so $4 \cdot 620 =$ **2480**. A GRU has three, so **1860**, which is 75% of the LSTM. In words: the LSTM keeps a separate cell state and has an output gate. The GRU merges forget and input into one update gate and uses the reset gate to scale the old state inside the candidate.

**8. One GRU step.** Convention: $h_t = (1 - z) \odot h_{t-1} + z \odot \tilde{h}$. Input $x = 1$, previous state $h_{t-1} = 0.5$. Update gate weights $(W_z, U_z, b_z) = (0.8, 0.4, 0)$, reset gate $(-0.5, 0.6, 0.1)$, candidate $(1.2, 0.9, -0.2)$.

$$z = \sigma(0.8 + 0.2) = 0.7311, \quad r = \sigma(-0.5 + 0.3 + 0.1) = 0.4750$$

$$\tilde{h} = \tanh(1.2 + 0.9 \cdot 0.4750 \cdot 0.5 - 0.2) = 0.8378$$

$$h_t = 0.2689 \cdot 0.5 + 0.7311 \cdot 0.8378 = \mathbf{0.7470}$$

**9. Delta numbers** ([Backprop Part 2](/blog/cse425-mid-backprop-hidden-layers/)). The output delta is $\delta_j = e_j \varphi'(v_j)$ and the hidden delta is $\delta_m = \varphi'(v_m) \sum_p \delta_p w_{pm}$. The derivation to show: $\partial E / \partial y_m = -\sum_p e_p \varphi'(v_p) w_{pm} = -\sum_p \delta_p w_{pm}$. Graders look for the sum over the next layer and the sign. Numbers: sigmoid output with $v = 0.8$ and target 1 gives $y = 0.6900$ and $\delta = (1 - 0.6900)(0.6900)(0.3100) =$ **0.0663**. A sigmoid hidden neuron with $v_h = -0.4$ feeding two outputs with deltas (0.0663, -0.05) through weights (0.5, 1.5) has $\varphi'(v_h) = 0.2400$ and $\delta_h = 0.2400 \cdot (0.0332 - 0.0750) =$ **-0.0101**.

**10. KL for a diagonal Gaussian** ([VAE Part 2](/blog/cse425-final-vae-elbo-kl/)). With $\mu = (1, -0.5)$ and $\sigma = (0.5, 2)$:

$$D_{KL} = \tfrac{1}{2} \sum_i \left( \mu_i^2 + \sigma_i^2 - 1 - \log \sigma_i^2 \right) = \tfrac{1}{2}(1.6363 + 1.8637) = \mathbf{1.75}$$

The six-mark derivation version: write the log-density difference, use $E[(z - \mu)^2] = \sigma^2$ and $E[z^2] = \sigma^2 + \mu^2$.

**11. Reparameterize** ([VAE Part 1](/blog/cse425-final-vae-encoder-reparameterization/)). $\mu = -0.3$, $\log \sigma^2 = 0.6$, $\varepsilon = -1.2$. Then $\sigma = e^{0.3} = 1.3499$ and $z = -0.3 + 1.3499 \cdot (-1.2) =$ **-1.920**.

**12. Weighted VAE loss** ([VAE Part 2](/blog/cse425-final-vae-elbo-kl/)). Reconstruction 12.5, KL 0.9, weight $\beta = 4$: total $12.5 + 4 \cdot 0.9 =$ **16.1**. With $\beta = 0$ you have a plain autoencoder. With a very large $\beta$ the posterior collapses onto the prior and the output turns blurry.

**13. Attention** ([Attention: Q, K, V](/blog/cse425-final-attention/)). Query $(1, 2)$, keys (1, 0), (0, 1), (1, 1), values (2, 0), (0, 4), (1, 1), $d_k = 2$. Scores $= (1, 2, 3)/\sqrt{2} = 0.707, 1.414, 2.121$. Softmax weights **0.140, 0.284, 0.576**. Output $= 0.140(2, 0) + 0.284(0, 4) + 0.576(1, 1) =$ **(0.856, 1.712)**.

**14. Positional encoding** ([The Transformer, Block by Block](/blog/cse425-final-transformer-architecture/)). $d_{model} = 4$, position 2, with the $10000^{2i/d}$ formula: $\sin(2) = 0.9093$, $\cos(2) = -0.4161$, $\sin(0.02) = 0.0200$, $\cos(0.02) = 0.9998$. A simplified classroom table also exists. Follow whichever your course used and say so.

**15. Receptive field, head size, residual** ([CNN Part 2](/blog/cse425-final-cnn-pooling-architectures/)). Three 3x3 layers with strides 1, 2, 1: the receptive field grows 3, 5, 9, so **9**. A global-average-pool head from 256 channels to 20 classes has $20(256 + 1) =$ **5140** parameters. A residual block's gradient is $1 + \partial f / \partial x$, so the identity path always carries gradient back.

## Exam corner

Asked in past exams. Shared weights plus a filter design appeared in 3 of 3 sittings. Gated RNN comparison appeared in 3 of 3. Conv-pool size arithmetic with the "stack until it fails" trap appeared in 2 of 3. A backprop delta derivation appeared in 2 of 3. True/false on CNN concepts appeared in both Fall 2020 sets. VAE, autoencoder and attention appeared in 0 of 3, so their place on your plan rests on the typed practice material.

Marks come from. For numbers: the formula, the substitution, the boxed result, a unit or meaning line. For derivations: each chain-rule step, the sum over the next layer, the correct sign. For compare questions: one named difference per row. For traps: the sentence that says why a stage cannot run.

Common slips. Rounding 62.5 up instead of flooring. Writing a flatten size after a stage that failed. Swapping the GRU reset gate and the LSTM forget gate. Using $\varphi''$ where $\varphi'$ belongs. Forgetting the minus sign in $\partial E / \partial y_m$.

Formula cheat line. $n' = \lfloor (n + 2p - k)/s \rfloor + 1$.

## Last-night checklist

Read these aloud once, then sleep.

Sizes and counts:

$$n' = \left\lfloor \frac{n+2p-k}{s} \right\rfloor + 1, \qquad \text{conv params} = C_{out}(k_h k_w C_{in} + 1), \qquad \text{dense params} = K(F+1)$$

$$RF_L = RF_{L-1} + (k_L - 1) \prod_{j<L} s_j, \qquad \text{GAP head} = K(C+1)$$

Gated cells: LSTM has four blocks, GRU three. GRU, with the convention declared:

$$z = \sigma(W_z x + U_z h_{t-1} + b_z), \quad r = \sigma(W_r x + U_r h_{t-1} + b_r)$$

$$\tilde{h} = \tanh(W_h x + U_h (r \odot h_{t-1}) + b_h), \quad h_t = (1 - z) \odot h_{t-1} + z \odot \tilde{h}$$

Backprop deltas: output $\delta_j = e_j \varphi'(v_j)$, hidden $\delta_m = \varphi'(v_m) \sum_p \delta_p w_{pm}$.

VAE:

$$z = \mu + \sigma \odot \varepsilon, \qquad D_{KL} = \tfrac{1}{2} \sum_i \left( \mu_i^2 + \sigma_i^2 - 1 - \log \sigma_i^2 \right), \qquad \text{loss} = \text{recon} + \beta \cdot KL$$

Attention:

$$\mathrm{Attn} = \mathrm{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right) V$$

Dividing by $\sqrt{d_k}$ keeps scores from growing with width and saturating the softmax. A causal mask blocks later tokens. Positional encoding adds order, since attention alone ignores it. Residual gradient: $1 + \partial f / \partial x$.

One-line answers worth memorising: reparameterize so gradients can pass through the sampling step; global average pooling shrinks the head and ignores position; convolution is translation equivariant, pooling adds a little invariance.

## Check yourself

<details>
<summary>1. A 64x64 image goes through 5x5 filters at stride 1, no padding, each followed by 2x2 stride 2 pooling. How many stages work?</summary>
Maps: 60 to 30, 26 to 13, 9 to 4, then 4 is smaller than 5, so the fourth conv fails. Three stages work. Say that explicitly.
</details>

<details>
<summary>2. Hidden size 32, input size 16. How many parameters in a GRU layer with one bias per block?</summary>
Each block has $32(16 + 32) + 32 = 1568$. Three blocks give 4704.
</details>

<details>
<summary>3. Reparameterize with $\mu = 0.5$, $\log \sigma^2 = 0$, $\varepsilon = 2$.</summary>
$\sigma = e^0 = 1$, so $z = 0.5 + 1 \cdot 2 = 2.5$.
</details>

## Read more

- [Stanford CS231n notes on convolutional networks](https://cs231n.github.io/convolutional-networks/), for size formulas and the parameter-count examples.
- [Understanding LSTM Networks by Colah](https://colah.github.io/posts/2015-08-Understanding-LSTMs/), the clearest gate diagrams, with a short section on the GRU.
- [The Illustrated Transformer by Jay Alammar](https://jalammar.github.io/illustrated-transformer/), for attention and positional encoding.
- [Dive into Deep Learning, convolutional networks chapter](https://d2l.ai/chapter_convolutional-neural-networks/index.html), for extra worked size and channel problems.

That is the series. Good luck on the paper.

<!-- Reviewer note: past-paper marks are not visible in any scan, so none are stated. Only three Final sittings could be identified (two sets of one paper plus a later sitting that repeats three questions). Statements about the original question texts for two of the long questions are inferred from answer scripts. The separability verdict (example 5) is the reasoning answer, not confirmed against the printed figure. Gated-cell questions are linked to the autoencoder post for the LSTM because no dedicated RNN post exists in this series. Check-yourself answers 1 to 3 were computed by hand and should be re-run once. -->

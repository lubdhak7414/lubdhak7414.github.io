---
title: "CSE 425 Final practice: CNN, VAE and attention problems"
description: "Revision for the CSE 425 Final: a conv-pool size trace that breaks, then fifteen worked problems on CNNs, gated RNNs, VAEs and attention, answers checked."
publishDate: '2026-11-02'
draft: true
tags: [neural-networks, cse425, exam-prep, cnn, vae, attention]
series: "CSE 425"
section: "Final"
part: 10
---

A $128\times128$ image goes through conv and pool stages, and its size runs 128, 62, 31, 14, 7, 2, 1. After that the next conv would need a 5-wide window on a map that's 1 wide. It's easy to write down a negative size and keep going, but what the question wants is one sentence: stage 4 can't run without padding.

Below are the kinds of calculation the Final series covered, each with new numbers, a checked answer and a link back to the note that teaches it. I've assumed you've read those notes. These are practice problems with fresh numbers, not copies of any paper, and they don't tell you what an exam will ask; check what your own instructor expects.

> **Key Takeaways**
> - A size trace stops at the first layer whose window no longer fits; a flatten size needs every layer to run.
> - Floor every division in the size formula before the $+1$: $61.5$ becomes $61$, so the size is $62$.
> - A GRU has three weight blocks to an LSTM's four, so 75% of its size at the same sizes.
> - A weighted VAE loss is $L_{recon}+\beta\,KL$.

## In the exam: where the arithmetic goes wrong

How much to write depends on the command word ("compute", "compare", "derive", "draw", "explain why"), and the [Mid practice problems](/blog/cse425-mid-exam-clinic/) go through what each one asks for. In the Final topics most arithmetic goes wrong in the givens instead. Check whether padding is stated, whether the stride applies to the pool as well as the conv, whether biases are counted, and which convention a gated cell uses. When two conventions exist, say which you use. For example, the GRU's update gate can multiply the candidate or the old state, and the two versions are mirror images.

If a question says "repeat until", it also wants you to notice when a stage becomes impossible, and that's easy to miss. Writing the formula before substituting helps, and so does flooring every division in the size formula:

$$n_{out}=\left\lfloor\frac{n+2p-k}{s}\right\rfloor+1$$

Here $n$ is the input size, $k$ the kernel (or pool window), $s$ the stride and $p$ the padding.

## A size trace that fails

The input is $128\times128$. Each stage is a conv with a $5\times5$ kernel, stride 2 and no padding, followed by a $2\times2$ pool with stride 2.

Stage 1 conv: $(128-5)/2=61.5$, which floors to 61, and $61+1=62$. Rounding $61.5$ up to 62 would give 63, which is wrong. The pool halves it: $62/2=31$.

Stage 2 conv: $(31-5)/2=13$, so $13+1=14$. Pool: $14/2=7$.

Stage 3 conv: $(7-5)/2=1$, so $1+1=2$. Pool: $2/2=1$.

Stage 4 conv: $(1-5)/2=-2$, so $-2+1=-1$. A size below 1 means the window doesn't fit. Stage 4 fails at its conv. Three stages work, the last map is $1\times1$, and a flatten size is only defined after stage 3. Write "stage 4 is impossible without padding" in words rather than carrying the $-1$ forward.

## Fifteen worked patterns

Each pattern has new numbers and the working in brief. The first is done in full, and later ones leave more for you. Patterns 7 to 9 revisit Mid topics that Final material builds on (the LSTM autoencoder, for one); the [Mid practice problems](/blog/cse425-mid-exam-clinic/) have more of those with different numbers.

### 1. Output size

Taught in [Convolution output size, stride and padding, by hand](/blog/cse425-final-cnn-basics/). Input 45, kernel 7, stride 2, padding 3. Substitute: $(45+6-7)=44$. Divide by the stride: $44/2=22$, which needs no flooring. Add 1:

$$n_{out}=22+1=23$$

### 2. Conv-pool trace until it breaks

Taught in [Pooling gradients, receptive field and skip connections](/blog/cse425-final-cnn-pooling-architectures/). Input $100\times100\times1$, eight $5\times5$ filters, stride 1, no padding, then a $2\times2$ pool with stride 2, repeated. The maps go 96 then 48, 44 then 22, 18 then 9, 5 then 2. A fifth $5\times5$ conv on a $2\times2$ map fails. Four stages work, and the flatten size is $8\cdot2\cdot2=32$.

### 3. Parameter count

Taught in [Convolution output size, stride and padding, by hand](/blog/cse425-final-cnn-basics/). A $3\times3$ conv from 3 channels to 20 filters with bias has $20(3\cdot3\cdot3+1)=560$ parameters. A dense layer from 20 to 40 units with bias has $40(20+1)=840$. The [CS231n notes](https://cs231n.github.io/convolutional-networks/) count whole networks this way, layer by layer.

### 4. Edge filter by hand

Taught in [Convolution output size, stride and padding, by hand](/blog/cse425-final-cnn-basics/). Every row of a $6\times6$ image reads $8,8,8,2,2,2$, and the filter has rows $(1,0,-1)$ in all three rows. In one output row, window 1 gives $3(8-8)=0$, window 2 gives $3(8-2)=18$, window 3 gives 18 and window 4 gives 0. The output row is $0,\,18,\,18,\,0$. The flipped filter gives $0,\,-18,\,-18,\,0$, and after ReLU only the first filter responds. The 18s sit where light turns to dark.

### 5. Can one conv layer separate shifted patterns?

Taught in [Pooling gradients, receptive field and skip connections](/blog/cse425-final-cnn-pooling-architectures/). Suppose a 1-D conv, then a linear layer, then a logistic output must separate every wrap-around shift of two bar patterns. With no nonlinearity in between, the stack collapses into one linear score on the input. Average that score over all shifts of a pattern with $m$ black cells and you get a value that depends only on $m$. Two patterns with the same $m$ cannot be separated, since their average scores are equal and one score cannot be positive for every shift of one and negative for every shift of the other. Two patterns with different $m$ can be separated by their count.

### 6. Why sharing helps

Taught in [Convolution output size, stride and padding, by hand](/blog/cse425-final-cnn-basics/). A $32\times32$ input to a fully connected layer of 1024 units has $1024(1024+1)=1{,}049{,}600$ parameters. One $3\times3$ filter with bias has 10, and sixteen have 160. That's 6,560 times fewer weights, and each filter still gets applied at every position.

### 7. Gated cells

Taught in [LSTM gates worked example: one step by hand](/blog/cse425-mid-lstm/) and [GRU by hand: update and reset gates, LSTM vs GRU](/blog/cse425-mid-gru/). Input size 10, hidden size 20. An LSTM has four weight blocks, each with $20(10+20)+20=620$ parameters, so $4\cdot620=2480$. A GRU has three, so $1860$, which is 75% of the LSTM. In words, the LSTM keeps a separate cell state and has an output gate. The GRU merges forget and input into one update gate and uses the reset gate to scale the old state inside the candidate. [Understanding LSTM Networks](https://colah.github.io/posts/2015-08-Understanding-LSTMs/) has clear gate diagrams, with a short section on the GRU.

### 8. One GRU step

Taught in [GRU by hand: update and reset gates, LSTM vs GRU](/blog/cse425-mid-gru/). The convention is $h_t=(1-z_t)\,h_{t-1}+z_t\,\tilde h_t$, where $z_t$ is the update gate, $r_t$ the reset gate and $\tilde h_t$ the candidate state. Input $x=1$, previous state $h_{t-1}=0.5$. The weights, on the input, on the previous state and the bias, are $(0.8,\,0.4,\,0)$ for the update gate, $(-0.5,\,0.6,\,0.1)$ for the reset gate and $(1.2,\,0.9,\,-0.2)$ for the candidate.

$$z_t=\sigma(0.8+0.2)=0.7311$$

$$r_t=\sigma(-0.5+0.3+0.1)=0.4750$$

$$\tilde h_t=\tanh(1.2+0.9\cdot0.4750\cdot0.5-0.2)$$

$$\tilde h_t=0.8378$$

$$h_t=0.2689\cdot0.5+0.7311\cdot0.8378$$

$$h_t=0.7470$$

### 9. Delta numbers

Taught in [Backpropagation worked example: hidden layer deltas](/blog/cse425-mid-backprop-hidden-layers/). The error is $e=\widehat{y}-y$ and $\delta=\partial L/\partial z$, with $L=\tfrac12\sum e^2$. The output delta is $\delta_j=e_j\,f'(z_j)$ and the hidden delta is $\delta_m=f'(z_m)\sum_p\delta_p\,w_{pm}$. Some course papers write $d$, $v$ and $\varphi$ for the target, pre-activation and activation function, and define the error the other way round, which flips the sign of every delta. The derivation to show is $\partial L/\partial a_m=\sum_pe_pf'(z_p)w_{pm}=\sum_p\delta_pw_{pm}$, with the sum over the next layer visible. In this pattern $z_j$, $z_m$ and $z_p$ are pre-activations of neurons, not the GRU update gate $z_t$ of pattern 8; the subscript tells them apart.

With numbers: a sigmoid output with $z=0.8$ and target 1 gives $\widehat{y}=0.6900$ and $e=-0.3100$, so

$$\delta=-0.3100\cdot0.6900\cdot0.3100=-0.0663$$

A sigmoid hidden neuron with $z_h=-0.4$ feeds two outputs with deltas $(-0.0663,\ 0.05)$ through weights $(0.5,\ 1.5)$. The slope is $f'(z_h)=0.4013\cdot0.5987=0.2403$ and the sum over the next layer is $-0.0332+0.0750=0.0418$:

$$\delta_h=0.2403\cdot0.0418=0.0101$$

### 10. KL for a diagonal Gaussian

Taught in [VAE loss by hand: ELBO and the Gaussian KL derivation](/blog/cse425-final-vae-elbo-kl/). With $\boldsymbol\mu=(1,\,-0.5)$ and $\boldsymbol\sigma=(0.5,\,2)$:

$$KL=\tfrac12\sum_i\left(\mu_i^2+\sigma_i^2-1-\ln\sigma_i^2\right)$$

$$=\tfrac12(1.6363+1.8637)=1.75$$

The derivation version writes the log-density difference and uses $\mathbb{E}[(z-\mu)^2]=\sigma^2$ and $\mathbb{E}[z^2]=\sigma^2+\mu^2$.

### 11. Reparameterise

Taught in [VAE reparameterisation trick, with one sample by hand](/blog/cse425-final-vae-encoder-reparameterization/). $\mu=-0.3$, $s=\ln\sigma^2=0.6$, $\varepsilon=-1.2$. Then $\sigma=e^{0.3}=1.3499$ and $z=-0.3+1.3499\cdot(-1.2)=-1.920$.

### 12. Weighted VAE loss

Taught in [VAE loss by hand: ELBO and the Gaussian KL derivation](/blog/cse425-final-vae-elbo-kl/). Reconstruction 12.5, KL 0.9, weight $\beta=4$: the total is $12.5+4\cdot0.9=16.1$. Set $\beta=0$ and you have a plain autoencoder; make it very large and the codes get pushed onto the prior, so the reconstructions turn blurry.

### 13. Attention

Taught in [Scaled dot-product attention: Q, K and V by hand](/blog/cse425-final-attention/). Query $(1,\,2)$, keys $(1,0)$, $(0,1)$, $(1,1)$, values $(2,0)$, $(0,4)$, $(1,1)$, $d_k=2$. The dot products are $1,\,2,\,3$, and dividing by $\sqrt2$ gives scores $0.707,\ 1.414,\ 2.121$. The softmax weights are $0.140,\ 0.284,\ 0.576$. The output is

$$0.140(2,0)+0.284(0,4)+0.576(1,1)$$

$$=(0.856,\ 1.712)$$

[The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/) draws the same steps for whole sentences.

### 14. Positional encoding

Taught in [Scaled dot-product attention: Q, K and V by hand](/blog/cse425-final-attention/). $d_{model}=4$, position 2, with the $10000^{2i/d_{model}}$ formula: the four entries are $\sin(2)=0.9093$, $\cos(2)=-0.4161$, $\sin(0.02)=0.0200$ and $\cos(0.02)=0.9998$. If a question supplies its own table of encodings, use that one and say so.

### 15. Receptive field, head size, residual

Taught in [Pooling gradients, receptive field and skip connections](/blog/cse425-final-cnn-pooling-architectures/). Three $3\times3$ layers with strides 1, 2, 1 give receptive fields $3,\,5,\,9$, so the answer is 9. A global-average-pool head from 256 channels to 20 classes has $20(256+1)=5140$ parameters. A residual block's gradient is $1+\partial F/\partial x$, so the identity path always carries gradient back.

## Formulas to have ready

Sizes and counts:

$$n_{out}=\left\lfloor\frac{n+2p-k}{s}\right\rfloor+1$$

$$\text{conv params}=C_{out}(k^2C_{in}+1)$$

$$\text{dense params}=K(F+1)$$

$$\text{dense, }m\text{ in, }n\text{ out: }mn+n$$

$$\text{LSTM: }4(mH+H^2+H)$$

Receptive field, with the previous layer's jump $J$ (the input pixels between neighbouring cells):

$$RF_l=RF_{l-1}+(k_l-1)J_{l-1}$$

Gated cells: an LSTM has four blocks and a GRU three. A GRU, with the convention declared:

$$z_t=\sigma(W_zx_t+U_zh_{t-1}+b_z)$$

$$r_t=\sigma(W_rx_t+U_rh_{t-1}+b_r)$$

$$\tilde h_t=\tanh\big(W_hx_t+U_h(r_t\odot h_{t-1})+b_h\big)$$

$$h_t=(1-z_t)\odot h_{t-1}+z_t\odot\tilde h_t$$

Backprop deltas, with $e=\widehat{y}-y$: output $\delta_j=e_jf'(z_j)$, hidden $\delta_m=f'(z_m)\sum_p\delta_pw_{pm}$.

VAE:

$$\mathbf z=\boldsymbol\mu+\boldsymbol\sigma\odot\boldsymbol\varepsilon$$

$$KL=\tfrac12\sum_i\left(\mu_i^2+\sigma_i^2-1-\ln\sigma_i^2\right)$$

$$L=L_{recon}+\beta\,KL$$

Attention:

$$\text{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)V$$

Dividing by $\sqrt{d_k}$ keeps the scores from growing with the width and saturating the softmax. A causal mask blocks later tokens. Positional encoding adds order, since attention alone ignores it.

Graph and map: a GCN layer is $f(\tilde D^{-1/2}\tilde A\tilde D^{-1/2}HW)$ with $\tilde A=A+I$ ([GNN message passing](/blog/cse425-final-gnn/)), and a Kohonen update is $\mathbf w\leftarrow\mathbf w+\eta h(\mathbf x-\mathbf w)$ ([Kohonen SOM worked example](/blog/cse425-final-kohonen-som/)).

Short answers worth knowing: reparameterise so gradients can pass through the sampling step; global average pooling shrinks the head and ignores position; convolution is translation equivariant and pooling adds a little invariance; a residual connection gives the gradient a path that cannot shrink.

## Practice: sizes, counts and sampling

A $64\times64$ image goes through $5\times5$ filters at stride 1 with no padding, each followed by a $2\times2$ stride-2 pool. How many stages work?

<details><summary>Answer</summary>

The maps run 60 then 30, 26 then 13, 9 then 4, and then the fourth conv would need a window of 5 on a map of 4, which fails. Three stages work. Say so explicitly.

</details>

The input size is 16 and the hidden size is 32. How many parameters does a GRU layer have, with one bias per block?

<details><summary>Answer</summary>

Each block has $32(16+32)+32=1568$. Three blocks give $4704$.

</details>

Reparameterise with $\mu=0.5$, $s=0$, $\varepsilon=2$.

<details><summary>Answer</summary>

$$\sigma=e^0=1$$

$$z=0.5+1\cdot2=2.5$$

</details>

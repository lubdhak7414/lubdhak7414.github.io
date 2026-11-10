---
title: "CNN Part 2: Pooling, Architectures, Backprop"
description: "Pooling by hand, a shape trace that runs until a layer no longer fits, parameter counts, and where gradients go through pools and skip connections."
publishDate: '2026-11-02'
draft: true
tags: [neural-networks, cse425, cnn, pooling, resnet]
series: "CSE 425 Final"
part: 2
---

"Pooling has no parameters, so it does not affect backprop" sounds sensible and is false. Pooling has nothing to learn, but gradients still have to travel through it on the way back, and where they go depends on which kind of pooling it is.

The other reason to care is size. A 28 by 28 digit goes through a 3 by 3 conv with 25 filters and comes out as 26 by 26 by 25, which is 16,900 numbers from 784 inputs. Without pooling, the next few layers keep that count high.

> **Key Takeaways**
> - A pool keeps one number per window, so a 2 by 2 pool with stride 2 halves height and width and leaves the channels alone.
> - Max pooling sends the whole gradient to the cell that won; average pooling splits it equally.
> - A shape trace stops the moment a layer's window no longer fits, and the answer then says so.
> - A second conv layer has filters as deep as the first layer's filter count, which is why its parameter count is so much larger.
> - A skip connection adds 1 to the gradient of a block, so the signal cannot shrink to nothing.

## What pooling does

Here is a 4 by 4 map. A 2 by 2 pool slides over it in steps of 2, and for each window keeps one number. Max pooling keeps the largest, which answers "did this pattern show up anywhere in here?". Average pooling keeps the mean. [Dive into Deep Learning has a chapter on pooling](https://d2l.ai/chapter_convolutional-neural-networks/pooling.html) with code for both.

$$\begin{bmatrix}1&5&2&0\\3&4&1&2\\0&2&6&1\\1&1&3&2\end{bmatrix}$$

The top-left window holds $1,5,3,4$. Its max is 5 and its average is $13/4=3.25$. Doing the other three windows the same way gives, for max pooling,

$$\begin{bmatrix}5&2\\2&6\end{bmatrix}$$

and for average pooling

$$\begin{bmatrix}3.25&1.25\\1&3\end{bmatrix}$$

Neither version has a learnable weight, and neither changes the number of channels. Each channel is pooled on its own.

Pooling uses the same size formula as a convolution, with the window as the kernel size $k$ (the stride, $s$, is how far the window jumps and $p$ is the padding):

$$n_{out}=\left\lfloor\frac{n+2p-k}{s}\right\rfloor+1$$

The stride of a pool defaults to the window size, so a 2 by 2 pool moves by 2. On the 4 by 4 map, $(4-2)/2+1=2$. An odd map loses its last row and column to the floor: a 5 by 5 map under 2 by 2 pooling becomes $\lfloor3/2\rfloor+1=2$, so 2 by 2 and not 3 by 3. Windows are normally 2 by 2 or 3 by 3, because a larger one makes a single number stand for too many cells. Pooling is also called subsampling: the resolution drops but the objects stay recognisable.

## Where the gradient goes

The gradient of a cell is how much the loss changes per unit nudge of that cell. One window has values $1,5,3,4$, and the gradient arriving at its pooled output is 0.8.

In max pooling the output equals the 5, so nudging the 5 moves the output one for one, and nudging any other cell does nothing. The 5 gets 0.8 and the other three get 0. In average pooling every cell contributes a quarter of itself to the output, so each cell gets $0.8/4=0.2$. In general, each of the $k^2$ cells gets $1/k^2$ of the incoming gradient.

## Tracing shapes until the network breaks

A shape-tracing question is the same procedure every time.

1. Write the input as height by width by channels.
2. Apply the size formula to each side of a conv. The channel count becomes the number of filters.
3. If the result is below 1, stop. The layer cannot run, and saying so is part of the answer.
4. Apply the formula to the pool. Channels stay the same.
5. Repeat for each conv and pool pair, checking step 3 each time.
6. The flatten length is height times width times channels of the last layer that ran. Forgetting the channels gives a wrong flatten count.
7. If the question does not give padding or stride, state what you assumed.

An example with a network that breaks: the input is $100\times100\times1$. Set A is a conv with 6 filters of $5\times5$, stride 2, no padding, then a 2 by 2 pool. Set B is a conv with 12 filters of $5\times5$, stride 2, then a 2 by 2 pool. Set C is the same as B.

Set A conv: the division is $95/2=47.5$, floored to 47, plus 1:

$$\lfloor(100-5)/2\rfloor+1=48$$

so the tensor is $48\times48\times6$. Pool: $24\times24\times6$.

Set B conv: $\lfloor(24-5)/2\rfloor+1=\lfloor9.5\rfloor+1=10$, so $10\times10\times12$. Pool: $5\times5\times12$.

Set C conv: $\lfloor(5-5)/2\rfloor+1=1$, so $1\times1\times12$. The 2 by 2 pool needs a window of 2 and the map is 1 wide, so the network breaks here.

Flatten after two sets: $5\times5\times12=300$.

Parameters use $C_{out}(k^2C_{in}+1)$ for a conv layer and $K(F+1)$ for a dense layer with $F$ inputs and $K$ outputs. Conv A has $6(25+1)=156$. Conv B takes in the 6 channels from set A, so $12(25\cdot6+1)=1812$. A 10-class dense head on 300 numbers has $10(300+1)=3010$. The total is $156+1812+3010=4978$. Pools have 0.

![Shape trace from 28x28x1 to 10 class scores with parameter counts 250, 0, 11,300, 0, 0 and 12,510 under each layer](img/cnn-pooling-architectures-cnn-shape-trace.svg)

The 28 by 28 chain in the figure is the same procedure. Conv 1 has $25(9+1)=250$. Conv 2 has $50(9\cdot25+1)=11{,}300$. Flatten gives 1250, and the dense head has $10(1250+1)=12{,}510$. The total is 24,060, and the dense head alone holds more than half of it.

The second conv works on the 25 maps that come out of the first. That is why its filters are $3\times3\times25$, and why its filter count (50 here) is a free choice that sets the next depth. After flatten the network is an ordinary dense one, for example 1250 to a hidden layer of 100 with ReLU, then 10 outputs with softmax so the scores become probabilities. Backprop runs through all of it, back into the filters. The conv layers' parameter counts never depend on the image size; the dense head after flatten does, through the flatten length.

## Backprop through a conv layer

The error arriving at a conv layer's output map is written $\delta=\partial L/\partial Y$, a grid the same shape as the output. A kernel weight is used at every position, so every position sends back a piece of gradient to it.

The smallest case worth doing by hand: a $3\times3$ input $X$ and a $2\times2$ kernel give a $2\times2$ output, and suppose $\delta$ is the identity matrix, 1 on the diagonal and 0 elsewhere:

$$X=\begin{bmatrix}1&2&0\\1&0&1\\2&1&1\end{bmatrix}$$

$$\delta=\begin{bmatrix}1&0\\0&1\end{bmatrix}$$

The weight in the kernel's top-left corner met $X[0,0]$ for output (0,0) and $X[1,1]$ for output (1,1), and the other two outputs have $\delta=0$. Its gradient is $1\cdot1+1\cdot0=1$. For the kernel's top-right weight, the cells are $X[0,1]=2$ and $X[1,2]=1$, giving $2+1=3$. The bottom row works out to 2 and 1:

$$\frac{\partial L}{\partial K}=\begin{bmatrix}1&3\\2&1\end{bmatrix}$$

In symbols, since the output is $y_{ij}=\sum_{u,v}X_{i+u,\,j+v}K_{u,v}$,

$$\frac{\partial L}{\partial K_{u,v}}=\sum_{i,j}\delta_{i,j}\,X_{i+u,\,j+v}$$

In words, the kernel gradient is the input correlated with $\delta$. There is one term per output position because the same kernel was used at each of them. The gradient to the input is $\delta$ convolved with the flipped kernel, using full padding; I'd learn to recognise that form rather than derive it every time.

## Receptive field

The receptive field of an output cell is the patch of the original input that can influence it. One 3 by 3 conv gives 3. A second stacked 3 by 3 conv, stride 1, sees 3 cells of the first map, each of which saw 3 input cells, overlapping so the patch is 5 wide. A third gives 7.

To handle pooling and strides, track the jump $J$, the number of input pixels between neighbouring cells of the current map. With the previous receptive field $RF_{l-1}$ and kernel size $k$:

$$RF_l=RF_{l-1}+(k-1)J_{l-1}$$

$$J_l=J_{l-1}\,s_l$$

The count starts from $RF_0=J_0=1$. For a stack of stride-1 3 by 3 convs this adds 2 each time, giving 3, 5, 7, 9, matching the count above. Use the previous layer's jump, not the current one. With dilation $d$, a kernel's cells are spaced $d$ apart and its effective size is $k'=d(k-1)+1$, so the field grows without new weights.

For example, a 3 by 3 stride-1 conv, a 2 by 2 stride-2 pool, then a 3 by 3 conv with dilation 2. The first conv: $RF=1+2\cdot1=3$, $J=1$. The pool: $RF=3+1\cdot1=4$, $J=2$. The dilated conv has $k'=2(2)+1=5$, so $RF=4+4\cdot2=12$.

[Distill's article on receptive fields](https://distill.pub/2019/computing-receptive-fields/) draws these growing patches.

## Skip connections and heads

A residual block computes $y=F(x)+x$, where $F$ is the block's layers. Its derivative is

$$\frac{\partial y}{\partial x}=1+\frac{\partial F}{\partial x}$$

If $\partial F/\partial x$ is 0.05, a plain block would pass back 0.05 of the gradient and the residual block passes back 1.05. The 1 comes from the $+x$. However small $\partial F/\partial x$ gets, the gradient still has a route back that isn't multiplied by it, and that's what lets very deep stacks of blocks train. If $F$ changes the channel count, a 1 by 1 conv on the skip path makes the shapes match before adding. The idea comes from the [ResNet paper](https://arxiv.org/abs/1512.03385). A U-Net also has skip connections, but it joins the encoder map to the decoder map by concatenating channels rather than adding, and its decoder grows the size back with an up-convolution (transposed conv), which does not recover the exact original values.

Global average pooling averages each channel to one number, $v_c=\frac{1}{n_h n_w}\sum_{i,j}A_{i,j,c}$ over a map of height $n_h$ and width $n_w$, and replaces flatten. A head for $K$ classes then costs $K(C+1)$ parameters for $C$ channels instead of a huge dense layer. Batch norm in a CNN works per channel, taking the mean and variance over the batch and both spatial axes and then scaling and shifting with two learned numbers per channel.

## Questions on shapes, pool gradients and receptive fields

A $64\times64\times3$ image goes through a conv with 16 filters of $3\times3$, stride 1, $p=1$, then a 2 by 2 max pool. What are the output shape and the conv parameter count?

<details><summary>Answer</summary>

The conv keeps 64 by 64 and gives $64\times64\times16$. The pool gives $32\times32\times16$.

$$16(9\cdot3+1)=448$$

</details>

In a 2 by 2 max pool the window values are 4, 9, 2, 7 and the incoming gradient is 0.8. What gradient does each cell get? What if it were average pooling?

<details><summary>Answer</summary>

Max: the cell holding 9 gets 0.8 and the other three get 0. Average: each cell gets $0.8/4=0.2$.

</details>

Three stride-1 convs with 5 by 5 kernels are stacked. What is the receptive field of one output cell?

<details><summary>Answer</summary>

Each layer adds $5-1=4$, so $1+4+4+4=13$.

</details>

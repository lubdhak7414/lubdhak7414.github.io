---
title: "Optimization, Regularization and Dropout"
description: "Pick a learning rate, explain momentum and Adam, and fix a network that scores 99% on training data and 62% on validation data."
publishDate: '2026-11-02'
draft: true
tags: [neural-networks, cse425, optimization, regularization, dropout]
series: "CSE 425 Mid"
part: 7
---

## Quick idea

A network reports 99% accuracy on training data and 62% on validation data. Nothing is broken in the code. The network memorized the training set, and the 37-point gap is the thing you have to fix. Two separate jobs are hiding in this topic. Optimization is about reaching a low training loss quickly and stably. Regularization is about making sure that low loss carries over to data the network has not seen.

The first job is mostly about one number, the learning rate $\eta$, and two tricks that smooth the path, momentum and Adam. The second is a set of ways to stop weights and units from becoming too specialised: weight penalties, early stopping and dropout.

## Picture it

![Weight and loss over 10 gradient steps on L = (w - 3)^2 from w = 0 for learning rates 0.1, 1.0 and 1.1](img/optimization-regularization-lr-loss-curves.svg)

*With eta = 0.1 the weight creeps toward 3. With eta = 1.0 it bounces between 0 and 6 and the loss sits at 9. With eta = 1.1 it diverges.*

![Illustrative training and validation loss curves: training loss keeps falling, validation loss reaches a minimum and then rises, with the early-stopping epoch marked](img/optimization-regularization-overfit-train-val.svg)

*Illustrative curves: the widening gap is variance. Early stopping keeps the weights from the epoch where validation loss was lowest.*

| Symptom | Diagnosis | First things to try |
|---|---|---|
| Loss jumps up and down or becomes NaN | Learning rate too high | Lower $\eta$, clip gradients, lower momentum |
| Loss barely moves | Learning rate too low, or plateau | Raise $\eta$, add momentum or Adam |
| Train 99%, validation 62% | Overfitting (high variance) | More data, L2, dropout, early stopping |
| Both poor | Underfitting (high bias) | Bigger model, train longer |

## The detail

Notation: $\theta$ for all parameters, $\eta$ the learning rate, $g_t=\nabla L(\theta_t)$ the gradient at step $t$.

Plain gradient descent steps downhill:

$$\theta_{t+1}=\theta_t-\eta\,g_t$$

Forget the minus sign and you climb the hill. With mini-batch SGD, $g_t$ is computed from a small random batch. It is a noisy estimate of the full gradient, but you get many cheap updates, and the noise can shake you off flat saddle points. Full-batch gradient is exact but costs memory and gives fewer updates.

Momentum keeps a velocity $v$ that remembers past gradients. The form used in the practice set is

$$v_{t+1}=\beta v_t+g_t,\qquad \theta_{t+1}=\theta_t-\eta\,v_{t+1}$$

where $\beta$ (often 0.9) is how much of the old velocity survives. Steps in a consistent direction add up, and zig-zag components cancel. Some books write $(1-\beta)g_t$ in the first equation, so state the form you use in an answer.

Adam combines momentum with a per-parameter step size. The two running averages are

$$m_t=\beta_1 m_{t-1}+(1-\beta_1)g_t,\qquad v_t=\beta_2 v_{t-1}+(1-\beta_2)g_t^2$$

The first tracks the average gradient, the second the average squared gradient. [outside] They start at zero, so they are corrected with $\hat m_t=m_t/(1-\beta_1^t)$ and $\hat v_t=v_t/(1-\beta_2^t)$, and the step is

$$\theta_{t+1}=\theta_t-\eta\,\frac{\hat m_t}{\sqrt{\hat v_t}+\epsilon}$$

with common defaults $\beta_1=0.9$, $\beta_2=0.999$, $\epsilon=10^{-8}$. Dividing by $\sqrt{\hat v_t}$ means parameters with big gradients take smaller steps, and rarely updated ones take larger steps. Early in training these statistics are unreliable, which is why learning-rate warmup (a small $\eta$ that grows over the first steps) is common, especially for transformers.

Regularization. Overfitting is high variance. Regularization accepts a little bias to buy lower variance.

L2 regularization adds a penalty on the squared weights:

$$L_{\text{total}}=L_{\text{data}}+\frac{\lambda}{2}\lVert w\rVert_2^2,\qquad \nabla\left(\tfrac{\lambda}{2}\lVert w\rVert^2\right)=\lambda w$$

Plug the extra gradient into the SGD step:

$$w\leftarrow w-\eta(\nabla L_{\text{data}}+\lambda w)=(1-\eta\lambda)\,w-\eta\nabla L_{\text{data}}$$

Every step first shrinks the weight by the factor $(1-\eta\lambda)$, which is why this is called weight decay. L1 uses $\lambda\lVert w\rVert_1$ instead [outside for the gradient $\lambda\,\mathrm{sign}(w)$]. Near zero the L2 pull $\lambda|w|$ fades away, so weights get small but rarely reach exactly zero. The L1 pull stays at size $\lambda$ no matter how small the weight is, so it pushes weights to exactly zero and gives sparse models. Geometrically, the L1 constraint region is a diamond with corners on the axes, and the L2 region is a circle. L2 also equals a zero-mean Gaussian prior on the weights, with $\lambda\propto 1/\sigma^2$.

AdamW applies the decay step $w\leftarrow w-\eta\lambda w$ directly to the weights, separate from the Adam step. Adam divides gradients by a per-parameter scale, and that would distort an L2 term placed in the loss.

Early stopping watches the validation loss and stops, or restores the best saved weights, when it has not improved for a set number of epochs. That number is the patience.

Dropout: during training each unit is zeroed with probability $p$, and survivors are scaled up. With mask $m_i\in\{0,1\}$ and keep probability $1-p$:

$$\tilde h_i=\frac{m_i\,h_i}{1-p},\qquad E[\tilde h_i]=\frac{(1-p)\,h_i}{1-p}=h_i$$

The expectation shows why this "inverted" dropout needs nothing special at test time: you run the full network with no mask and no rescaling. Dropout stops units from relying on particular partners being present (co-adaptation). Be careful with the word "rate": here it means the drop probability. At $p=0.5$ the keep and drop probabilities are equal and hide the mix-up.

[outside] Label smoothing (true class gets $1-\epsilon$, the rest share $\epsilon$) and max-norm (force $\lVert w\rVert_2\le c$ after each step) are two other regularizers you may see named.

## Worked example

Loss $L(w)=(w-3)^2$, so $g=2(w-3)$. Start at $w_0=0$.

With $\eta=0.1$: $w_1=0-0.1(-6)=0.6$, then $1.08$, $1.464$, $1.771$. Safe but slow.

With $\eta=1.0$: $w_1=6$, then $0$, then $6$, then $0$. It bounces forever.

With $\eta=1.1$: $6.6$, $-1.32$, $8.184$, $-3.221$. Each step lands further away, so it diverges.

Momentum with $\beta=0.9$, $\eta=0.1$, $v_0=0$:

$v_1=-6$, $w_1=0.6$. $v_2=0.9(-6)+2(0.6-3)=-10.2$, $w_2=1.62$. $v_3=0.9(-10.2)+2(1.62-3)=-11.94$, $w_3=2.814$. $v_4=0.9(-11.94)+2(2.814-3)=-11.118$, $w_4=3.926$.

It overshoots 3 on step 4, which plain SGD at $\eta=0.1$ never does. In exchange it got there in far fewer steps.

Adam's first step at $w_0=0$ [outside]: $m_1=0.1(-6)=-0.6$, $v_1=0.001(36)=0.036$. Corrected: $\hat m=-6$, $\hat v=36$. Step $=0.1\times6/\sqrt{36}=0.1$. The first Adam step has size about $\eta$ whatever the gradient size.

L2 shrinkage with $\eta=0.1$, $\lambda=0.5$: the factor is $1-0.05=0.95$, so a weight of 2 becomes $1.9$ before the data gradient is applied.

Dropout on $h=[2,4,6,8]$, mask $[1,0,1,0]$, $p=0.5$: $\tilde h=[4,0,12,0]$. With $p=0.8$ and the same mask the survivors are divided by 0.2: $[10,0,30,0]$.

$$\boxed{\text{SGD }\eta{=}0.1:\ 0.6,\,1.08,\,1.464,\,1.771;\quad \text{momentum:}\ 0.6,\,1.62,\,2.814,\,3.926;\quad \tilde h=[4,0,12,0]}$$

## Exam corner

Asked in past exams: this topic did not appear in any past Mid or quiz paper we have (0 papers). It appears only in the practice problem set, and nothing says whether it is in this semester's Mid, so confirm scope with your instructor. In that set the questions take these forms: write an update rule, say what a symbol does, compare two methods (L1 vs L2, dropout vs L2, full batch vs mini-batch, AdamW vs L2), diagnose a symptom (99% vs 62%, wildly oscillating loss), one tiny numeric step, and design an experiment that reports training curves, validation curves and a final train-versus-validation table.

Marks come from: the update rule with the correct sign, naming each symbol, the diagnosis (high variance or high bias) before the remedy, and one reason per remedy.

Common slips:
- Calling the dropout "rate" the keep probability.
- Scaling at both train and test time.
- Saying L2 gives exact zeros.
- Calling a train/validation gap high bias.
- Dropping the minus sign in the update.

Cheat line: $\theta\leftarrow\theta-\eta g$; L2 gives $w\leftarrow(1-\eta\lambda)w-\eta\nabla L$; dropout $\tilde h=mh/(1-p)$.

## Check yourself

1. Gradient descent on $L=(w-3)^2$ from $w_0=0$ sends $w$ back and forth between 0 and 6 forever (the loss sits at 9). What is $\eta$, and why?

<details><summary>Answer</summary>
$\eta=1$. Each step maps $w$ to $w-2(w-3)=6-w$, so $0\to6\to0$. Anything above 1 diverges.
</details>

2. Why does L1 produce exact zeros but L2 does not?

<details><summary>Answer</summary>
L1 pulls with constant size $\lambda$ regardless of how small the weight is. L2 pulls with size $\lambda|w|$, which shrinks to nothing as $w\to0$.
</details>

3. You use dropout with $p=0.8$ on $h=[1,2,3,4,5]$ and the mask keeps units 2 and 5. What is $\tilde h$, and what do you do at test time?

<details><summary>Answer</summary>
Divide survivors by $0.2$: $\tilde h=[0,10,0,0,25]$. At test time use the full layer with no mask and no rescaling.
</details>

## Read more

- [Stanford CS231n notes on training neural networks, including optimizers and regularization](https://cs231n.github.io/neural-networks-3/)
- [d2l.ai chapter on optimization algorithms](https://d2l.ai/chapter_optimization/index.html)
- [Dropout paper by Srivastava and others](https://jmlr.org/papers/v15/srivastava14a.html)
- [Adam paper by Kingma and Ba](https://arxiv.org/abs/1412.6980)

<!-- Reviewer note: no lecture source exists for this topic and no past paper asks it. The post rests on the practice problem set (problems on SGD, momentum, Adam moments, L2, L1, early stopping, dropout, AdamW) plus standard facts marked [outside]. Syllabus scope is unconfirmed. -->

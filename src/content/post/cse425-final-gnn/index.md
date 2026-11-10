---
title: "Graph Neural Networks"
description: "One graph convolution layer worked by hand on a 3-node graph, why node order must not matter, and how GCN, GraphSAGE-mean and GAT differ."
publishDate: '2026-11-02'
draft: true
tags: [neural-networks, cse425, gnn, graph-convolution]
series: "CSE 425 Final"
part: 8
---

Nine atoms can be written down in 9! = 362,880 different orders, and a molecule is the same molecule in every one of them. A network that reads a list of atoms and gives a different answer for each order is reacting to the list, not the molecule.

Graph neural networks (GNNs) are built so the order cannot matter. A graph is a set of nodes joined by edges, like atoms and bonds, or people and friendships. There's no first node and no fixed number of neighbours, so a plain dense layer or a fixed-size kernel does not fit. GNNs borrow the idea of a convolution. Each node looks at its neighbours, combines what it sees with an order-free operation such as a sum or a mean, and updates its own vector.

> **Key Takeaways**
> - A GNN layer gathers neighbour vectors, combines them with an order-free function, and updates each node with weights and a nonlinearity.
> - Relabelling the nodes only relabels the output rows, a property called permutation equivariance, and a mean, sum or max readout over all nodes is unaffected by order.
> - GCN adds self-loops and normalises by the degree at both ends of an edge, GraphSAGE-mean averages neighbours and gives the node's own vector a separate weight, and GAT learns a weight for each neighbour.
> - Too many layers pull all node vectors toward one value, called oversmoothing, so two or three layers are typical.

## A tiny graph and its matrix

Three nodes sit in a line: node 0 joined to node 1, and node 1 joined to node 2. The adjacency matrix $A$ has a 1 in row $i$, column $j$ when nodes $i$ and $j$ are joined, and a 0 otherwise:

$$A=\begin{bmatrix}0&1&0\\1&0&1\\0&1&0\end{bmatrix}$$

Each node gets one number: $\mathbf x=(1,\,2,\,3)$. Multiplying $A$ by $\mathbf x$ makes each row pick out the neighbours of that node and adds their values. Row 0 has a single 1, in column 1, so it returns $x_1=2$. Row 1 has 1s in columns 0 and 2, so it returns $1+3=4$. Row 2 returns 2:

$$A\mathbf x=(2,\,4,\,2)$$

Multiplying by the adjacency matrix is "sum my neighbours". Every layer in this note starts from that and adds weights and some normalisation on top.

In general the $N$ nodes carry features in an $N\times F$ matrix $X$, with $F$ numbers per node. $\mathbf h_v^{(k)}$ is the vector of node $v$ after layer $k$, with $\mathbf h_v^{(0)}=\mathbf x_v$ its input features, and $\mathcal N(v)$ is the set of neighbours of $v$. $W$ is a learned weight matrix and $f$ a nonlinearity such as ReLU.

The matrix is handy for a three-node example, but real graphs are usually stored another way. An adjacency matrix has $N^2$ entries, and an edge list (one row per edge, two node numbers each) has $2E$ for $E$ edges. For 1000 nodes and 5000 edges that is 1,000,000 entries against 10,000.

## Why the order must not matter

If the nodes of the tiny graph are renumbered, the sums above move with them, since a node's neighbour sum does not depend on what it is called. A layer with this property is permutation equivariant, meaning that relabelling the input nodes relabels the output rows in exactly the same way. A graph-level answer, such as one label for a whole molecule, needs permutation invariance, meaning the output does not change at all. A mean, sum or max over all the nodes gives that, because they ignore order.

## Message passing

Every layer gathers the neighbour vectors, aggregates them with an order-free function, and updates with weights and a nonlinearity. The simplest version just sums:

$$\mathbf h_v^{(k)}=f\Big(\sum_{u\in\mathcal N(v)}\mathbf h_u^{(k-1)}\Big)$$

Sums depend on degree, the number of neighbours. A node with 100 neighbours each holding the value 2 gets 200, and a node with 2 such neighbours gets 4. Every neighbour holds the same value, yet one total is 50 times the other. Normalising removes that gap. GraphSAGE-mean, GCN and GAT each handle it their own way, and since the names get mixed up a lot, it's worth keeping their equations apart.

GraphSAGE-mean averages the neighbours and gives the node's own vector a separate weight matrix $B$:

$$\mathbf m_v=\frac{1}{|\mathcal N(v)|}\sum_{u\in\mathcal N(v)}\mathbf h_u^{(k-1)}$$

$$\mathbf h_v^{(k)}=f\big(W^{(k)}\mathbf m_v+B^{(k)}\mathbf h_v^{(k-1)}\big)$$

Here $\mathbf m_v$ is the mean of the neighbours' vectors.

You'll sometimes see this model labelled "GCN". The separate $B$ is how to tell them apart: here the node's own vector never goes into the average, while GCN (next) mixes it in through a self-loop.

On the tiny graph, with $W=2$ and $B=1$, node 1 has neighbours 0 and 2, whose mean is $(1+3)/2=2$, so $h_1=f(2\cdot2+1\cdot2)=6$.

GCN (Kipf and Welling) adds a self-loop to every node so it keeps its own signal, then divides by the degree at both ends of each edge. Let $\tilde A=A+I$, where $I$ puts a 1 on the diagonal, and let $\tilde D$ be the diagonal matrix of the degrees counting the self-loop, $\tilde D_{ii}=\sum_j\tilde A_{ij}$. Then

$$\bar A=\tilde D^{-1/2}\tilde A\,\tilde D^{-1/2}$$

$$H^{(k)}=f\big(\bar A\,H^{(k-1)}W^{(k)}\big)$$

Here $H^{(k)}$ stacks all node vectors, one per row, and $\bar A$ is the normalised adjacency matrix (the bar marks normalisation, as in the batch-norm note). Entry by entry, $\bar A_{ij}=\tilde A_{ij}/\sqrt{\tilde d_i\tilde d_j}$, so per node

$$\mathbf h_v=f\Big(\sum_{u\in\mathcal N(v)\cup\{v\}}\frac{1}{\sqrt{\tilde d_v\tilde d_u}}\,W\mathbf h_u\Big)$$

Because it divides by the degree at both ends of an edge, a high-degree neighbour counts for less, and the rows of $\bar A$ need not sum to 1 (in the worked example below, row 1 sums to 1.150). In matrix form, $\bar AH$ aggregates and multiplying by $W$ transforms.

GAT (graph attention) learns how much each neighbour matters instead of fixing weights from degrees. A score for the pair $(v,u)$ comes from a learned vector $\mathbf c$ applied to the two transformed vectors joined end to end (the symbol $\|$ is that concatenation), and a softmax turns the scores into weights $\alpha$ that sum to 1:

$$e_{vu}=\text{LeakyReLU}\big(\mathbf c^\top[W\mathbf h_v\,\|\,W\mathbf h_u]\big)$$

$$\alpha_{vu}=\frac{\exp e_{vu}}{\sum_{w\in\mathcal N(v)\cup\{v\}}\exp e_{vw}}$$

$$\mathbf h_v=f\Big(\sum_{u\in\mathcal N(v)\cup\{v\}}\alpha_{vu}W\mathbf h_u\Big)$$

This is the same softmax idea as in [attention](/blog/cse425-final-attention/), applied only over a node's neighbours.

## A GCN layer by hand

The path graph 0-1-2 has scalar features $\mathbf x=(1,\,2,\,3)$. The layer uses weight $w=2$, ReLU, and a mean readout.

Step 1, add self-loops. Each node gains a neighbour, itself, so $\tilde d=(2,\,3,\,2)$: node 0 has one neighbour plus itself, node 1 has two plus itself.

Step 2, build $\bar A$ from $\bar A_{ij}=\tilde A_{ij}/\sqrt{\tilde d_i\tilde d_j}$. For instance $\bar A_{01}=1/\sqrt{2\cdot3}=0.4082$ and $\bar A_{11}=1/3=0.3333$:

$$\bar A=\begin{bmatrix}0.5&0.4082&0\\0.4082&0.3333&0.4082\\0&0.4082&0.5\end{bmatrix}$$

Step 3, aggregate with $\bar A\mathbf x$:

$$0.5\cdot1+0.4082\cdot2=1.3165$$

$$0.4082\cdot1+0.3333\cdot2+0.4082\cdot3=2.2997$$

$$0.4082\cdot2+0.5\cdot3=2.3165$$

Step 4, transform by multiplying by $w=2$, giving $(2.633,\ 4.599,\ 4.633)$. All are positive, so ReLU changes nothing.

![Node 1 of the path graph 0-1-2 gathers 0.4082, 0.6667 and 1.2247 from node 0, itself and node 2, sums them to 2.2997, multiplies by the shared weight 2 to get 4.599, and ReLU keeps 4.599](img/gnn-message-passing.svg)

Step 5, read out the whole graph with a mean over the nodes:

$$g=(2.633+4.599+4.633)/3=3.955$$

A sum readout would give 11.865 and a max readout 4.633. For comparison, GraphSAGE-mean with $W=2$, $B=1$ on the same graph gives $5,\,6,\,7$ for the three nodes. The numbers differ because the node's own value enters separately instead of through the normalised sum.

## Readout, depth and cost

For one label per graph, pool the final node vectors, for example $\mathbf g=\frac1{|V|}\sum_i\mathbf h_i^{(L)}$ over all nodes, then classify with $\widehat y=f(W\mathbf g+b)$. Don't mix the two up: aggregation runs over one node's neighbours, readout over every node in the graph.

After $k$ layers a node has seen its $k$-hop neighbourhood, everything reachable in $k$ steps, and entry $(A^k)_{ij}$ counts the walks of length $k$ between $i$ and $j$. Go too deep and every node has averaged over most of the graph, until all node vectors drift toward the same value. That's oversmoothing, and it's why two or three layers is typical.

The weights are shared across nodes, so a layer from 16 to 8 features has $16\cdot8+8=136$ parameters (the weight matrix plus a bias) whether the graph has 4 nodes or $10^6$. Compute still grows with the number of edges.

## Answering a GNN question

For a written answer, the pieces I'd want to be able to produce cold are the three steps (gather, aggregate, update), the normalised equation with every symbol defined, and how GCN differs from GAT. For a numeric layer, show $\bar AH$ first and then times $W$, and do not drop the self-loops: $\tilde A$ is $A+I$, and the symmetric form $\tilde D^{-1/2}\tilde A\tilde D^{-1/2}$ is not the row normalisation $\tilde D^{-1}\tilde A$.

The [Distill introduction to graph neural networks](https://distill.pub/2021/gnn-intro/) is an illustrated walk through graphs, message passing and readout, and [Kipf's explainer](https://tkipf.github.io/graph-convolutional-networks/) comes from the GCN author.

## Questions on order and degree

Why does a GNN layer use a sum, mean or max instead of a concatenation of neighbours?

<details><summary>Answer</summary>

Neighbours have no order and their number varies. Concatenation depends on order and size, while sum, mean and max give the same result for any ordering.

</details>

A node has 50 neighbours with value 3 and another has 5 with value 3. What does a plain sum give for each, and what does a mean give?

<details><summary>Answer</summary>

Sum: 150 and 15. Mean: 3 and 3. That gap is why normalisation is used.

</details>

For the path graph above, what is $\tilde d$ for the middle node, and why is it 3?

<details><summary>Answer</summary>

It has two neighbours plus its own self-loop, so $\tilde d=3$. Without self-loops it would be 2.

</details>

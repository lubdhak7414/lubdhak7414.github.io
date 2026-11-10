---
title: "VAE Part 2: ELBO and KL Divergence"
description: "The two goals inside a VAE loss, one image's loss computed by hand, where the Gaussian KL formula comes from, and what the ELBO bounds."
publishDate: '2026-11-02'
draft: true
tags: [neural-networks, cse425, vae, kl-divergence, elbo]
series: "CSE 425 Final"
part: 5
---

A VAE has two goals that pull against each other. It wants to rebuild the image well, and it wants every code to look like it came from a standard bell curve. Drop the second goal and every image gets its own tiny private spot, with useless space in between. Push it too hard and every image gets the same blurry code and the decoder stops listening.

The loss is those two goals added together, with one weight setting the balance between them. The picture to keep in mind is the cloud from [VAE Part 1: Encoder and the Reparameterization Trick](/blog/cse425-final-vae-encoder-reparameterization/): the encoder gives each image a small cloud of codes, and the KL term measures how far that cloud is from the standard one.

> **Key Takeaways**
>
> - The loss is L = L_recon + β·KL, with β = 1 in the plain VAE.
> - For one latent dimension, the KL to N(0,1) is ½(μ² + σ² − 1 − ln σ²), and with several independent dimensions the values add.
> - The ELBO is the negative of this loss, and it is a floor under ln p(x), the log-probability the model gives the image.
> - The KL in the loss compares the encoder with the prior N(0,I); the KL in the derivation compares it with the true posterior, which can't be computed.
> - β = 0 gives a plain autoencoder, and a very large β makes every output a blurry average.

## The loss for one image, by hand

An input $\mathbf x=(1,0)$ has two pixels. The encoder gives $\mu=0.3$ and $s=-0.5$ for a one-dimensional code, where $s=\ln\sigma^2$ as before. The decoder, run on the sampled $z$, returns $\widehat{\mathbf x}=(0.7,\,0.4)$. Logs are natural logs throughout.

Reconstruction. Each pixel is read as a probability of being "on" (a Bernoulli decoder). For pixel $x_i$ with prediction $\widehat{x}_i$, the log-probability of what was seen is $\ln\widehat{x}_i$ if the pixel was 1 and $\ln(1-\widehat{x}_i)$ if it was 0. One formula covers both:

$$x_i\ln\widehat{x}_i+(1-x_i)\ln(1-\widehat{x}_i)$$

Pixel 1 has $x_1=1$, so it scores $\ln0.7=-0.3567$. Pixel 2 has $x_2=0$, so it scores $\ln(1-0.4)=\ln0.6=-0.5108$. The sum is

$$\ln p_\theta(\mathbf x|z)=-0.3567-0.5108=-0.8675$$

KL. The closed form for one dimension, derived below, is $\tfrac12(\mu^2+\sigma^2-1-\ln\sigma^2)$. Here $\sigma^2=e^{-0.5}=0.6065$ and $\ln\sigma^2=s=-0.5$, so

$$KL=\tfrac12\big(0.09+0.6065-1+0.5\big)$$

$$=\tfrac12(0.1965)=0.0983$$

Put together, the ELBO is the reconstruction score minus the KL, and the loss you minimise is its negative:

$$\text{ELBO}=-0.8675-0.0983=-0.9658$$

$$L=0.9658$$

Equivalently $L=L_{recon}+\beta KL$, where $L_{recon}=0.8675$ is the negative reconstruction score and $\beta=1$. With a Gaussian decoder of fixed variance the reconstruction score reduces to a negative squared error (up to a scale and a constant), so you'd use that instead. In practice the sum runs over every pixel, one sampled $z$ stands in for the average over $z$, and the loss gets averaged over a mini-batch.

![Contour plot of per-dimension KL over mu and sigma squared with its zero at (0, 1) and marked points 0.1366, 0.3181, 0.5 and the worked example 0.0983, plus two slices through the minimum](img/vae-elbo-kl-vae-kl-surface.svg)

## Where the KL formula comes from

The KL from $q=N(\mu,\sigma^2)$ to $p=N(0,1)$ is the average, under $q$, of the log of the ratio of the two densities: $KL=\mathbb{E}_q[\ln q(z)-\ln p(z)]$. Here $\mathbb{E}_q$ means "average over $z$ drawn from $q$". Writing out both Gaussian densities:

$$\ln q(z)=-\tfrac12\ln(2\pi)-\tfrac12\ln\sigma^2-\frac{(z-\mu)^2}{2\sigma^2}$$

$$\ln p(z)=-\tfrac12\ln(2\pi)-\frac{z^2}{2}$$

Subtracting, the $\ln2\pi$ terms cancel:

$$\ln q-\ln p=-\tfrac12\ln\sigma^2-\frac{(z-\mu)^2}{2\sigma^2}+\frac{z^2}{2}$$

Averaging over $z\sim q$ uses two facts from [the maths note](/blog/cse425-final-prerequisites/): $\mathbb{E}[(z-\mu)^2]=\sigma^2$ and $\mathbb{E}[z^2]=\sigma^2+\mu^2$. The middle term becomes $\sigma^2/(2\sigma^2)=\tfrac12$ and the last becomes $\tfrac12(\sigma^2+\mu^2)$:

$$KL=-\tfrac12\ln\sigma^2-\tfrac12+\tfrac12(\sigma^2+\mu^2)$$

$$=\tfrac12\big(\mu^2+\sigma^2-1-\ln\sigma^2\big)$$

Check against the numbers: with $\mu=0.3$ and $\sigma^2=0.6065$ this is the 0.0983 above. Other points on the figure: $\mu=0.5$, $\sigma^2=0.8$ gives 0.1366 and $\mu=0$, $\sigma^2=0.25$ gives 0.3181.

For a diagonal Gaussian the dimensions are independent, so there are no cross terms and you add the formula over the $K$ dimensions. If the encoder gives $s=\ln\sigma^2$, each dimension is $\tfrac12(\mu^2+e^{s}-1-s)$. Don't take the log of $s$; it's already a log. Two shortcuts save time: with $\sigma=1$ the formula drops to $KL=\tfrac12\sum\mu_i^2$, and with $\mu=0$ it's $KL=\tfrac12\sum(\sigma_i^2-1-\ln\sigma_i^2)$. Both at once ($\mu=0$, $\sigma=1$) gives exactly 0.

A two-dimensional case: $\boldsymbol\mu=(0,\,1)$ and $\boldsymbol\sigma=(1,\,2)$. The first dimension is the prior itself and contributes 0. The second gives $\tfrac12(1+4-1-\ln4)=\tfrac12(4-1.3863)=1.3069$. Total $KL=1.3069$.

A three-dimensional case, $\boldsymbol\mu=(0.5,\,-1,\,0.2)$ and $\boldsymbol\sigma=(1.2,\,0.5,\,0.8)$, has terms $0.1627$, $0.8181$ and $0.0631$, total $1.0440$. The middle dimension dominates because a narrow $\sigma=0.5$ and a shifted $\mu=-1$ both cost.

## Where the loss comes from

Ideally the decoder would be trained to maximise $\ln p_\theta(\mathbf x)$, the log of how probable it finds each training image. That probability averages over every code that could have produced the image:

$$p_\theta(\mathbf x)=\int p_\theta(\mathbf x|\mathbf z)\,p(\mathbf z)\,d\mathbf z$$

With a neural-network decoder this integral has no closed form, and it is too large to compute by brute force. A quantity like this, which cannot be calculated exactly, is called intractable.

The same problem hits the true posterior $p_\theta(\mathbf z|\mathbf x)$, the real distribution over codes given an image, found by Bayes' rule as $p_\theta(\mathbf x|\mathbf z)p(\mathbf z)/p_\theta(\mathbf x)$. It needs the intractable $p_\theta(\mathbf x)$ in the denominator. That's why the encoder $q_\phi(\mathbf z|\mathbf x)$ exists: it's a stand-in for the true posterior that you can actually evaluate.

The derivation uses the fact that $\ln p_\theta(\mathbf x)$ does not depend on $\mathbf z$. Since $p_\theta(\mathbf x,\mathbf z)=p_\theta(\mathbf z|\mathbf x)\,p_\theta(\mathbf x)$, the ratio $p_\theta(\mathbf x,\mathbf z)/p_\theta(\mathbf z|\mathbf x)$ is just $p_\theta(\mathbf x)$, so averaging its log under $q$ changes nothing:

$$\ln p_\theta(\mathbf x)=\mathbb{E}_{q}\!\left[\ln\frac{p_\theta(\mathbf x,\mathbf z)}{p_\theta(\mathbf z|\mathbf x)}\right]$$

Multiplying and dividing by $q_\phi(\mathbf z|\mathbf x)$ inside the log splits it into two averages, the ELBO and a KL:

$$\ln p_\theta(\mathbf x)=\underbrace{\mathbb{E}_{q}\!\left[\ln\frac{p_\theta(\mathbf x,\mathbf z)}{q_\phi(\mathbf z|\mathbf x)}\right]}_{\text{ELBO}}$$

$$+KL\big(q_\phi(\mathbf z|\mathbf x)\,\|\,p_\theta(\mathbf z|\mathbf x)\big)$$

KL is never negative, so $\ln p_\theta(\mathbf x)\ge\text{ELBO}$. The ELBO (evidence lower bound) is a floor under the quantity we want. Because $\ln p_\theta(\mathbf x)$ is fixed for a given model, pushing the ELBO up squeezes the gap, which is the KL to the true posterior.

The ELBO becomes computable once the joint is expanded as $p_\theta(\mathbf x|\mathbf z)\,p(\mathbf z)$:

$$\text{ELBO}=\mathbb{E}_{q_\phi(\mathbf z|\mathbf x)}\big[\ln p_\theta(\mathbf x|\mathbf z)\big]$$

$$-KL\big(q_\phi(\mathbf z|\mathbf x)\,\|\,p(\mathbf z)\big)$$

The first term is the reconstruction score worked out by hand at the top. The second is the KL from the encoder's cloud to the prior $N(0,I)$, which has the closed form derived above.

Watch which KL you write down. The one in the identity compares $q$ with the true posterior and can't be computed; the one in the trainable ELBO compares $q$ with the prior and has a closed form for Gaussians. If a question asks for the loss, it wants the second.

## Why the weight matters

With $\beta=0$ the KL term vanishes, and what's left is an ordinary autoencoder with some noise on top. The clouds shrink to dots and drift apart.

Raise $\beta$ far enough and the cheapest move is to make the KL zero, which happens only when $q$ matches the prior exactly. Every input then gets the same cloud, the decoder learns to ignore $z$, and every output is a blurry average. This is called posterior collapse.

[From Autoencoder to Beta-VAE](https://lilianweng.github.io/posts/2018-08-12-vae/) shows how changing $\beta$ changes the code space, and the [evidence lower bound article](https://en.wikipedia.org/wiki/Evidence_lower_bound) gives the derivation by a second route.

## Practice on the KL and reconstruction terms

$\boldsymbol\mu=(3,\,-1)$, $\boldsymbol\sigma=(1,\,1)$. What is the KL to $N(0,I)$?

<details><summary>Answer</summary>

With $\sigma=1$ the shortcut gives

$$\tfrac12(9+1)=5$$

</details>

What does the encoder learn if the KL weight is 0, and if it is very large?

<details><summary>Answer</summary>

At 0 you get a plain autoencoder: tight, separated clouds and poor samples from the prior. A very large weight gives posterior collapse: $q$ matches the prior for every $\mathbf x$, so the decoder ignores $z$ and outputs a blurry generic image.

</details>

A single pixel has $x=1$. Compare the reconstruction loss for $\widehat{x}=0.9$ and $\widehat{x}=0.1$.

<details><summary>Answer</summary>

$-\ln0.9=0.1054$ and $-\ln0.1=2.3026$. A confident wrong pixel costs about 22 times more.

</details>

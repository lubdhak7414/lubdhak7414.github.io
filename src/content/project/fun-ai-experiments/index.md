---
title: 'Three Tiny Generators That Do One Thing Each'
name: 'Three Tiny Generators'
description: 'Three small text generators trained from scratch in PyTorch on one shared architecture: ASCII roguelike maps, cat monologues and pseudo-assembly.'
publishDate: '08 July 2026'
homePageIdx: 8
coverImage:
  src: './cover.webp'
  alt: 'Three terminal windows showing ASCII art, cat dialogue, and assembly code'
tags: ['Python', 'PyTorch', 'Machine Learning', 'NLP', 'Project']
links:
  - {
      label: 'ASCII Cartographer',
      url: 'https://github.com/lubdhak7414/ascii-cartographer',
      kind: 'code'
    }
  - {
      label: 'Feline Monologue',
      url: 'https://github.com/lubdhak7414/feline-monologue',
      kind: 'code'
    }
  - {
      label: 'Hardware Whisperer',
      url: 'https://github.com/lubdhak7414/hardware-whisperer',
      kind: 'code'
    }
facts:
  license: 'MIT'
  stack: ['PyTorch']
glance:
  does: 'Three small text generators on one shared engine: roguelike ASCII maps, a judgmental cat, and English rewritten as pseudo-assembly.'
  did: 'Built all three from scratch in PyTorch, each with its own tokenizer, training data and validators.'
---

I built three small text generators to test one idea: can the same architecture code do completely unrelated jobs? One draws ASCII roguelike maps, one answers questions as a judgmental cat, and one rewrites English as pseudo-8086 assembly. They share every line of architecture code.

> **Key Takeaways**
>
> - Three projects, one decoder-only sequence engine (6 layers, 6 heads, 384 dimensions), trained from scratch in PyTorch
> - ASCII Cartographer generates roguelike maps, Feline Monologue answers as a judgmental cat, Hardware Whisperer rewrites English as pseudo-8086 assembly
> - With the architecture fixed, the tokenizer, training data and validators are what make each project work

## Why three instead of one

The original idea was a single demo. But one system doesn't show the architecture is reusable. Three unrelated outputs from the same training skeleton make the case.

Each project uses a small decoder-only sequence architecture: 6 layers, 6 attention heads, 384-dimensional embeddings. Checkpoints bake the tokenizer into the `.pt` file. Resumable fp16 training via GradScaler. All three run on inexpensive cloud GPUs.

## ASCII Cartographer

This one takes a text prompt like "dungeon with water tiles and three rooms" and emits a fixed 24x12 ASCII roguelike map. Correct walls, doors, water glyphs, and a legend at the bottom.

The training data came from five procedural map generators: BSP rooms, cellular-automata caves, drunkard's-walk tunnels, overworld terrain, and composite scenes. Each generator writes ground-truth descriptions of what it placed, so the training pairs are self-describing.

I used a char-level tokenizer instead of BPE. BPE eats whitespace unpredictably, which breaks column arithmetic in grids. Structural validators catch bad outputs: dimension checks, glyph whitelists, legend consistency, and flood-fill connectivity to ensure no floating rooms.

## Feline Monologue

Every question gets answered as a dramatic, deeply judgmental house cat. The persona bible defines twenty recurring motifs (the food bowl, the void, the red dot), twenty-one forbidden assistant-speak phrases, and six gold example responses.

Training data came through a message-batch API, with a seeded offline mock for local iteration. Byte-level BPE tokenizer at 8k vocab. The interactive interface includes a disdain slider that maps directly to temperature. Crank it up and the cat gets progressively more unhinged.

## Hardware Whisperer

English goes in. Pseudo-8086 assembly comes out. A rule-based rewriter maps verbs to opcodes (go becomes JMP, check becomes CMP, stop becomes HLT) and assigns nouns to registers. An 8086 opcode and register whitelist validator rejects anything that doesn't look like plausible assembly.

The interface is CRT-styled: green-on-black monospace with a scanline effect.

## What I learned

The shared architecture was the real point. A 384-dimensional decoder-only engine is a blank canvas. It doesn't care whether it's generating maps, monologues, or machine code. The tokenizer, the training data, and the post-processing validators do the heavy lifting. The system is just the pattern-matching engine underneath.

All three are MIT licensed, with pytest suites, interactive demos and shared notebooks. Each repo is linked at the top of this page.

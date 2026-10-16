---
title: Generate stems with Max 4 Live
date: 2020-05-17T13:38:28-04:00
tag:
  - max4live
  - ableton
  - music production
readTime: 1 min
image: /images/ableton.jpg
featured: false
draft: false
---

### MAX FOR LIVE DEVICE

## [SPLEETER4MAX](https://github.com/diracdeltas/spleeter4max/releases/){:target="_blank"}

Spleeter is a max for live device that splits a song up into 4 stems: drums, bass, vocals, and others. Requires Python3.7, ffmpeg, and spleeter. There are two versions available: a docker image that requires at least 16GB of memory, or a python library. 

I first tried the docker image, hoping that I could use additional swap space but that 16GB requirement is a hard limitation, which I couldn't use. So I tried the python library, and that worked like a charm. I was able to split up some tracks that way. It does take a little bit of time to complete, but you will have 4 stems afterwards, which is pretty cool. No fuss, no muss. Now you can get started on that hot remix you've been thinking about. 


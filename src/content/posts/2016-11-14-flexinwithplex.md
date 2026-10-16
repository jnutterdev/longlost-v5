---
title: 'Flexin'' with Plex'
date: 2016-11-14T19:42:00-05:00
excerpt: |
  A few months ago, I installed a headless Ubuntu server on an old laptop and installed Plex on it, too. Over the weekend, I was looking at the IP addresses on my network and realized that I still had Plex running on it. So I gave it a shot and started copying a couple movies to the Plex folders.
tag:
  - linux
  - network
  - plex
  - movies
  - goodtimes
readTime: 2 min
featured: false
draft: false
---

A few months ago, I installed a headless Ubuntu server on an old laptop and installed Plex on it, too. Some time went by; out of sight, out of mind. Over the weekend, I was looking at the IP addresses on my network and realized that I still had Plex running on it. So I gave it a shot and copied a couple movies to the Plex folders. The movies were there, but why couldn't Plex see them? Then I recalled that file permissions were a pretty big deal. So I changed them all to the plex user, and BOOM. I was in business. Plex saw them all right away. But then I started running into this issue where it couldn't convert the files as it was running low on disk space. 

So I found an old hard drive, copied all the movies on to it, and then tried to connect. No dice. The more I read, I realized that the drive was formatted for NTFS so I couldn't assign permissions to it that Plex could read. Arg. Now what? Then it occurred to me that I could just partition the drive, format the new partition for ext4, and then toss all the movies on the partition. Score! After mounting the new drive and adding the folder to Plex it found all of the movies. Now I'm in business, and happily watching all of my old favorite movies. It's a shame that some of the old DVDs and VHS tapes I once had are now out of print, and don't appear to have any plans for being released to blu-ray. Though, that's probably a story for another day. 

All in all, this weekend was pretty great for a refresher on working with Linux and file permissions. I feel like I'm even more confident in my ability to work strictly with the command line and I've got a lot of really awesome movies at my fingertips now. 

Music of the day, Revealing the Concealed ep by Current Value. Broken drum and bass beats, with pumping basslines. This music has kept me going through my new work hours. Good stuff. 

<iframe style="border: 0; width: 100%; height: 120px;" src="https://bandcamp.com/EmbeddedPlayer/album=2600528297/size=large/bgcol=212121/linkcol=9a64ff/tracklist=false/artwork=small/transparent=true/" seamless><a href="http://futuresicknessrecords.bandcamp.com/album/current-value-revealing-the-concealed-ep">Current Value - Revealing The Concealed EP by Future Sickness Records</a></iframe>

---
title:  "GSoC - Edge Example App: CPU Temperature"
last_modified_at: 2022-09-05 03:27:05 +0100
classes: wide
author_profile: true
author: Ahmad Ateya
toc: true
categories:
  - blog
tags:
  - [flotta, devices, workloads, gsoc]
excerpt: ""
header:
  overlay_image: /assets/tty/tty_unix.png
---
> This blog was originally published at [project-flotta.io](https://project-flotta.io/flotta/2022/09/05/edge-example-app-cpu-temp.html){:target="\_blank"} as part of my Google Summer of Code contribution in 2022.

## Introduction

Edge Example App is an app for Flotta Edge devices, with a workload that will be deployed on the device that has two main features:

Sensing the Internet (which helps to construct devices network topology). (see [part 1](https://project-flotta.io/flotta/2022/09/04/edge-example-app-sense-the-internet-part-1.html){:target="\_blank"} and [part 2](https://project-flotta.io/flotta/2022/09/05/edge-example-app-sense-the-internet-part-2.html){:target="\_blank"})
Read CPU temperature (which indicate how much load the device is handling).<= this article

As Project Flotta goal is to manage workloads deployed on small-footprint devices, reading the CPU temperature is a good way to know how much load the device is handling. this App Along with the Web UI Interface, helps to collect and visualize the CPU temperature of the device over the day by presenting it as a Line Graph, making it easy to identify the time of the day when the device is handling more load.


## How this app works

This app reads the CPU temperature from the device and saves it to a file on the device, the device worker will send it to the edge cluster, and the edge cluster will save it to the S3 bucket (same synchronization mechanism used for the Internet sensing feature).

On the backend side, the edge cluster will read the file from the S3 bucket, calculate the average temperature for every hour and expose this data to the web UI with endpoints, which will present it to the user as a line graph.

## Example of logs produced by this app
```log
2022/09/04 11:11:25 {"Temp":43}
2022/09/04 11:12:25 {"Temp":42.5}
2022/09/04 12:13:25 {"Temp":42.5}
2022/09/04 12:14:25 {"Temp":43}
2022/09/04 13:15:25 {"Temp":44}
```

## Example of presented data
<img src="/assets/images/cpu-temp-graph.png" alt="CPU line graph" width="800"/>

## How to use this app

This feature is part of the Edge Example App, so you can use the same manifests explained in [part 1](https://project-flotta.io/flotta/2022/09/04/edge-example-app-sense-the-internet-part-1.html){:target="\_blank"} to deploy the app to your device.

## Future work Ideas
- Add more sensors to the app, like CPU usage, memory usage, etc.
- Upload the data to Prometheus or Thanos as it provides more features for data visualization and analysis.

## GitHub Repositories
- [https://github.com/project-flotta/flotta-edge-example](https://github.com/project-flotta/flotta-edge-example){:target="\_blank"} <= Device App
- [https://github.com/project-flotta/flotta-webapp-frontend](https://github.com/project-flotta/flotta-webapp-frontend){:target="\_blank"} <= Web App frontend
- [https://github.com/project-flotta/flotta-webapp-backend](https://github.com/project-flotta/flotta-webapp-backend){:target="\_blank"} <= Web App backend
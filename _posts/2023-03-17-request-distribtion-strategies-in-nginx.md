---
title:  "Request distribution strategies in Nginx"
last_modified_at: 2023-03-17 03:27:05 +0100
classes: wide
author_profile: true
author: Ahmad Ateya
toc: true
categories:
  - blog
tags:
  - [nginx, devops, load-balancer]
excerpt: ""
header:
  overlay_image: /assets/images/nginx-load-balancing/nginx-load-balancer.png
---
Nginx is a popular open-source web server software, that can be used for web serving, reverse proxying, caching, load balancing, media streaming, and more!

Using Nginx as an HTTP load balancer to distribute traffic to several application servers and improve servers resource availability and efficiency is a common use.

In this article I want to explain the Request distribution strategies (AKA: load-balancing methods) supported in Nginx and Nginx Plus (the commercial version of the Nginx, it includes additional enterprise-grade features and support services not available in the open-source version).

## 1. Round Robin (the default)
With round-robin scheme each server is selected in turns according to the order you set them in the conf file.

<img src="/assets/images/nginx-load-balancing/round-robin-method.png" alt="Round-robin" width="800"/>

nginx uses a round-robin algorithm `by default` if no other method is defined.
```nginx
http {
    upstream myapp {
        server srv1.example.com;
        server srv2.example.com;
        server srv3.example.com;
        server srv4.example.com;
    }
    server {
        listen 80;
        location / {
            proxy_pass http://myapp;
        }
    }
}
```
This method ensures equal distribution of incoming requests among available servers, but does not ensure equal distribution of the load among servers.

What if we have one of the servers is twice as capable as the other two?

### Weighted Round-robin
In the example above, the server weights are not configured which means that all specified servers are treated as equally qualified for serving the requests.

When the `weight` parameter is specified for a server, the weight is accounted as part of the load balancing decision. 

<img src="/assets/images/nginx-load-balancing/weighted-method.png" alt="weighted round-robin" width="800"/>

As you can see in the preceding figure, Nginx will forward two out of the first four incoming requests to server 1 (because it's weight=2), and forward one to server 2, and another one to server 3 before it starts the cycle again.

and this how you would configure it:
```nginx
  [...]
  upstream myapp {
      server srv1.example.com weight=2;
      server srv2.example.com;
      server srv3.example.com;
  }
```

## 2. Least Connections
with this method the request is sent to the server with the least number of active connections with server weights taken into consideration. 

This allows you to control the load on application instances more fairly in a situation when some of the requests take longer to complete.

<img src="/assets/images/nginx-load-balancing/least-conn-method.png" alt="least connection method" width="800"/>

If there are several server with the same weight and number of active connection, they are tried in turn using a weighted round-robin balancing method.

you can configure it by `least_conn` directive:
```nginx
  [...]
  upstream myapp {
      least_conn;

      server srv1.example.com;
      server srv2.example.com;
      server srv3.example.com;
  }
```

## 3. IP_hash
IP hash is a method where requests are distributed between servers based on client's IP addresses. The first three octets of the client IPv4 address, or the entire IPv6 address, are used as a hashing key. 

This method is helpful if your web application is statefull. 

The method ensures that requests from the same client will always be passed to the same server *except when this server is unavailable*. In this case (server is unavailable) client requests will be passed to another server. Most probably, it will always be the same server as well.

<img src="/assets/images/nginx-load-balancing/ip-hash-method.png" alt="Ip_hash method" width="800"/>

you can configure it by `ip_hash` directive:
```nginx
  [...]
  upstream myapp {
      ip_hash;

      server srv1.example.com;
      server srv2.example.com;
      server srv3.example.com;
  }
```

## 4. Generic Hash
Like the IP_hash this method based on the hashing concept but instead of for depending on client's IP addresses, you can use any hashed key-value. The key can contain text, variables, and their combinations. 

For example, the key may be a paired source IP address and port, or a URI as in this example:

```nginx
  [...]
  upstream myapp {
    hash $request_uri;

    server srv1.example.com;
    server srv2.example.com;
    server srv3.example.com;
  }
```

Or based on a custom hash key to determine the backend server, like this example:
```nginx
  [...]
  upstream myapp {
    hash $cookie_session_id;

    server srv1.example.com;
    server srv2.example.com;
    server srv3.example.com;
  }
```

Note that adding or removing a server from the group may result in remapping most of the keys to different servers. The method is compatible with the `Cache::Memcached` Perl library.

## 5. Least Time (Nginx Plus only)
In this method Nginx Plus selects the server with the lowest average latency and the lowest number of active connections, where the lowest average latency is calculated based on which of the following parameters to the `least_time` directive is included
- `header` – Time to receive the first byte from the server
- `last_byte` – Time to receive the full response from the server
- `last_byte inflight` – Time to receive the full response from the server, taking into account incomplete requests

```nginx
  [...]
  upstream myapp {
    least_time header;

    server srv1.example.com;
    server srv2.example.com;
    server srv3.example.com;
  }
```

## 6. Random
In this method each request will be passed to a randomly selected server. 

simply configure it by adding the `random` directive.
```nginx
  [...]
  upstream myapp {
    random;

    server srv1.example.com;
    server srv2.example.com;
    server srv3.example.com;
  }
```

#### two parameter
`random` directive has an optional parameter called `two`, using it will instruct Nginx to randomly pick 2 servers from the list. Then the load will be balanced between those 2 servers according to the method that we specified taking into account [server weights](https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/#weights), and then chooses one of these servers using the specified method:

- `least_conn` – The least number of active connections
- `least_time=header` (NGINX Plus) – The least average time to receive the response header from the server (`$upstream_header_time`)
- `least_time=last_byte` (NGINX Plus) – The least average time to receive the full response from the server (`$upstream_response_time`)

Like in this example:
```nginx
  [...]
  upstream myapp {
    random two least_time=last_byte;

    server srv1.example.com;
    server srv2.example.com;
    server srv3.example.com;
  }
```

The `Random` load balancing method should be used for distributed environments where multiple load balancers are passing requests to the same set of backends. For environments where the load balancer has a full view of all requests, use other load balancing methods, such as round robin, least connections and least time.


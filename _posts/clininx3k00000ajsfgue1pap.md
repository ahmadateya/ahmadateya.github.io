---
title: "Memory Management in DBMS"
datePublished: Thu Jun 08 2023 19:13:19 GMT+0000 (Coordinated Universal Time)
cuid: clininx3k00000ajsfgue1pap
slug: memory-management-in-dbms
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1685829932400/0a5aa54c-34ab-4df6-a524-76750a1f0af2.jpeg
tags: databases, software-engineering, dbms, 2articles1week, buffer-pool

---

## Introduction

In the last two articles, we were concerned with how the DBMS looks on disk. In this article, we are going to see how DBMS manages its memory and moves data back and forth from the disk and memory. Since, for the most part, data cannot be directly operated on the disk, any database must be able to efficiently move data represented as files on its disk into memory so that it can be used.

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1685706412094/42f348b4-23c3-480c-b4d2-1d003c3a3065.png align="center")

An obstacle that DBMSs face is the problem of minimizing the slowdown of moving data around. Ideally, it should “appear” as if the data is all in the memory already. The execution engine shouldn’t have to worry about how data is fetched into memory, this problem can be approached by considering spatial and temporal control.

#### **Spatial vs. Temporal control**

**Spatial Control** refers to **<mark>where</mark>** to write pages on disk (physically). The goal of spatial control is to keep pages that are used together often as `physically close together` as possible on disk.

**Temporal Control** refers to **<mark>when</mark>** to read pages into memory and **when** to write them to disk. Temporal control aims to minimize the `number of stalls` from having to read data from disk.

Before diving into the buffer pool details and mechanisms, We need to make a distinction between `locks` and `latches` when discussing how the DBMS protects its internal elements.

#### **Locks vs. Latches**

**Locks:** A lock is a logical mechanism used to protect the contents of a database (e.g., tuples, tables, databases) from interference by other transactions. It acts as a **higher-level** primitive that ensures data integrity and prevents concurrent access conflicts.

* Transactions will hold a lock for their entire duration.
    
* Database systems can expose to the user which locks are being held as queries are run.
    
* Locks must have the capability to rollback changes if necessary.
    

**Latches:** Latches are essential **low-level** protection primitives utilized by the DBMS to safeguard critical sections within its internal data structures (e.g., hash tables, regions of memory).

* Latches are held for only the duration of the operation being made.
    
* Latches do not need to be able to rollback changes.
    

**<mark>Latches</mark>** <mark>in DBMS are what we call </mark> **<mark>Locks</mark>** <mark>in OS.</mark>

## Buffer Pool

The buffer pool serves as a cache in memory for pages retrieved from disk. It is a memory area structured as an array consisting of fixed-size pages (if you have variable-size pages you would have separate buffer pools for each), with each entry in the array referred to as a ***frame***.

### Page Requesting in DBMS

When the DBMS requests a page an exact copy is placed into one of the frames of the buffer pool. Then, the database system can search the buffer pool first when a page is requested. If the page is not found, then the system fetches a copy of the page from the disk.

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1685824427010/93643344-2cd1-4e39-82e1-15e910573835.gif align="center")

> **Dirty pages**
> 
> An important concept related to pages in DBMS is Dirty pages, Dirty pages are the pages in the memory buffer that have modified data, yet the data is not moved from memory to disk.
> 
> Dirty pages in DBMS are buffered and not written back immediately. ( Write-Back Cache in the OS parlance ).
> 
> We are going to need this concept many times in this article and other upcoming articles in the future.

### Buffer Pool Meta-data

To ensure efficient and correct usage, the buffer pool requires some metadata:

**Page Table**

The page table is an in-memory *hash table* that keeps track of the pages currently in memory. It establishes a mapping between <mark>page IDs</mark> and their corresponding <mark>frame locations</mark> in the buffer pool. Since the order of pages in the pool doesn't necessarily match the disk's order, this indirection layer helps identify page locations within the pool.

> **Note that there is a difference between Page Table and Page Directory**
> 
> **Page Table:** is the mapping from page ids to a copy of the page in buffer pool frames. This is an **in-memory** data structure that does not need to be stored on disk.
> 
> **Page Directory:** is the mapping from page ids to page locations in the database files. All changes to the page directory must be recorded **on disk** to allow the DBMS to find on restart.

The page table itself maintains extra metadata for each page:

* **The Dirty Flag:** is set by a thread whenever it modifies a page. This flag notifies the storage manager that the page needs to be written back to disk.
    
* **The Pin/Reference Counter:** keeps track of the number of threads currently accessing a particular page(either reading or modifying it). Before accessing the page, a thread must increment the counter. If the counter is greater than zero, the storage manager cannot evict that page from memory.
    

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1685824989783/c8262125-c3d2-428a-9db9-116ee5ee5581.png align="center")

### Memory Allocation Policies

Memory in the database is allocated for the buffer pool according to two policies:

**Global policies:** deal with decisions that the DBMS should make to benefit the entire workload that is being executed. It considers all active transactions to find an optimal decision for allocating memory.

**Local policies:** makes decisions that will make a single query or transaction run faster, even if it isn’t good for the entire workload. It allocates frames to specific transactions without considering the behavior of concurrent transactions.

Most systems use a combination of both global and local views.

In the next section, we will examine several of these optimization policies.

## Buffer Pool Optimizations

There are several ways to optimize a buffer pool to suit the workload of an application:

1. Multiple Buffer Pools
    
2. Pre-Fetching
    
3. Scan Sharing
    
4. Buffer Pool Bypass
    

### Multiple Buffer Pools

One of the primary optimizations is to implement multiple buffer pools. By maintaining separate buffer pools for different purposes (such as per-database buffer pool or per-page type buffer pool), the DBMS can employ specific policies customized for the data stored in each pool. This approach effectively reduces latch contention and enhances data locality, resulting in improved performance.

Two methods can be used to map desired pages to a buffer pool:

**1\. Object IDs**

In the object IDs approach, record IDs are extended to include an object identifier. This object identifier enables the maintenance of a mapping between objects and specific buffer pools.

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1685828634092/4bed32b9-581a-4f11-ac01-1bd88f1d0965.png align="center")

**2\. Hashing**

The hashing approach involves the DBMS hashing the page ID to determine which buffer pool to access. This hashing mechanism assists in selecting the appropriate buffer pool for retrieving the desired page (this is the MySQL approach).

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1685828640956/a762903a-3769-416e-b745-0315628f0e66.png align="center")

One basic idea in this context is to ensure that a physical page exists in only one buffer pool. It is undesirable to have multiple threads mapping the same page to different buffer pools, as it would result in having duplicate copies of the page in memory. To avoid this situation, the goal is to maintain a consistent mapping of pages to buffer pools, ensuring that each physical page resides in a single buffer pool.

### Pre-fetching

Another optimization technique involves pre-fetching pages based on the query plan. As the first set of pages is being processed, the DBMS can proactively fetch the second set of pages into the buffer pool. This strategy is particularly effective when accessing a large number of pages sequentially. By anticipating the data needs of the query and pre-loading the relevant pages, the DBMS minimizes the wait time for subsequent page accesses, leading to improved query performance.

### Scan Sharing (Synchronized Scans)

Scan Sharing, also known as Synchronized Scans, is a technique that enables the reuse of data retrieved from one query for other queries that may attempt to read the same data simultaneously. This approach allows multiple queries to access and utilize the same set of data, avoiding the need to retrieve it separately for each query.

Scan Sharing, is different from Result Caching, It operates at a lower level within the DBMS, specifically within the buffer pool. It involves reusing pages that have been fetched by one query and making them available for reuse by another query. Instead of caching the output of a query, Scan Sharing focuses on reusing the underlying data pages that have already been loaded into memory.

The primary purpose of this technique is to enable query sharing when one query is scanning a table that is already being scanned by another query. In such cases, the DBMS can attach the cursor of the second query to the existing cursor, allowing them to share the scan process. Importantly, the queries do not necessarily have to be identical. The DBMS keeps track of the point where the second query joins with the first, ensuring that it can continue the scan from that point onwards. By facilitating query sharing in this way, intermediate results can be shared between queries, improving efficiency and reducing redundant processing.

### Buffer Pool Bypass

By employing this technique, the DBMS bypasses the buffer pool and stores the fetched pages directly in the memory or cache. This approach eliminates the overhead associated with the buffer pool manager. However, it comes with the trade-off that the pages are specific to the running queries and are cleared from memory once the queries complete execution.

This method works well when the operator needs to read a large sequence of pages that are contiguous on disk. It can also be effectively applied when handling temporary data, such as sorting or join operations.

## OS Page Cache

Most disk operations go through the OS API. Unless explicitly told otherwise, the OS maintains its own filesystem cache. Most DBMS use direct I/O [(O\_DIRECT)](https://linux.die.net/man/2/open) to bypass the OS’s cache in order to avoid redundant copies of pages and manage different eviction policies. not Loss of control over file I/O.

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1685997780024/a6b2084b-ab83-4ea8-a89a-e39366a39dfc.png align="center")

## Buffer Replacement Policies

When the DBMS needs to free up a frame to make room for a new page, it must decide which page to evict from the buffer pool. A replacement policy is an algorithm that the DBMS implements that makes a decision on which pages to evict from the buffer pool when it needs space.

When designing a replacement policy, the following factors should be considered:

1. **Speed**: The replacement policy should be efficient and not significantly slow down the system when applied.
    
2. **Correctness**: The chosen replacement policy should produce accurate and reliable results, ensuring that the evicted page does not impact the correctness of the system.
    
3. **Accuracy**: The replacement policy should strive to be as accurate as possible in selecting the most suitable page for eviction based on various criteria, such as the recency of use or frequency of access.
    
4. **Low Overhead**: The replacement policy should not require excessive storage of metadata or introduce high overhead for the system. It should strike a balance between maintaining necessary information for eviction decisions and minimizing resource consumption.
    

There are many page replacement policies and algorithms, one of the most common and straightforward ones is the **"Least Recently Used" (LRU)** policy. And there is another faster approximation of LRU is known as the **Clock** algorithm.

### **Least Recently Used (LRU)**

The Least Recently Used (LRU) replacement policy operates by maintaining a timestamp for each page in the buffer pool, indicating when it was last accessed. When the DBMS needs to evict a page from the buffer pool, it selects the page with the oldest timestamp.

To efficiently implement the LRU policy, the timestamps can be stored in a separate data structure, such as a queue. This allows for easy sorting of the timestamps and simplifies the process of identifying the page with the oldest timestamp. By using a separate data structure for managing the timestamps, the overhead of sorting during eviction can be reduced, leading to improved efficiency in the replacement process.

### Clock

The CLOCK policy is an approximation of LRU that does not require maintaining a separate timestamp for each page. Instead, each page is assigned a reference bit. When a page is accessed, its reference bit is set to 1.

To visualize this, organize the pages in a circular buffer with a “clock hand”. Upon sweeping check if a page’s bit is set to 1. If yes, set it to zero, if no, then evict it. In this way, the clock hand remembers the position between evictions.

### Alternatives

There are several problems with `LRU` and `CLOCK` replacement policies.

**Problem**

LRU and CLOCK replacement policies can be susceptible to an issue called ***Sequential Flooding***. This occurs when a sequential scan reads every page in the buffer pool, causing the timestamps or reference bits of all pages to be updated. As a result, the replacement policy may mistakenly consider recently accessed pages as frequently used, even if they are not needed.

In such cases, the most recently used page according to the replacement policy may be the least necessary page. This can lead to inefficient eviction decisions, where important pages are evicted while less important pages remain in the buffer pool.

**Solutions**

To address the limitations of LRU and CLOCK policies, there are three proposed solutions:

1. **LRU-K**: This solution involves tracking the history of the last K references to each page, effectively maintaining a longer timestamp history. By considering the interval between subsequent accesses, the DBMS can predict the next time a page will be accessed. This approach improves the accuracy of determining the importance of pages and helps make better eviction decisions.
    
2. **Localization per Query**: Instead of applying a global replacement policy, the DBMS can optimize the buffer pool on a per-transaction or per-query basis. By considering the specific needs of each transaction or query, the buffer pool can be tailored to minimize interference and pollution from unrelated queries. This approach improves the efficiency of the buffer pool by prioritizing pages based on the active workload.
    
3. **Priority Hints**: Transactions or queries can provide hints to the buffer pool about the importance or relevance of specific pages based on their context during query execution. These priority hints assist the buffer pool in making informed decisions when selecting pages for eviction. By leveraging the knowledge provided by transactions, the buffer pool can prioritize the retention of critical pages and optimize performance accordingly.
    

These three solutions aim to enhance the effectiveness, efficiency, and adaptability of page replacement policies in managing the buffer pool, ultimately improving the overall performance of the DBMS.

### Dirty Pages

There are two approaches to handling pages with dirty bits in the buffer pool:

1. **Fast Eviction**: The fastest option is to drop any page in the buffer pool that is not marked as dirty. This means that if a page has not been modified since it was loaded into the buffer pool, it can be evicted without the need to write it back to disk. This approach prioritizes fast eviction of clean pages to make room for new pages.
    
2. **Write Back**: The slower method involves writing back dirty pages to disk to ensure that any modifications are persisted. When a page is modified, its dirty bit is set to indicate that it needs to be written back to disk at some point. By periodically walking through the page table, the DBMS can identify dirty pages and write them back to disk. Once a dirty page has been safely written, the DBMS can choose to either evict the page from the buffer pool or unset the dirty flag, depending on the specific implementation.
    

These two methods highlight the trade-off between fast eviction and ensuring data durability by persisting modified pages. While fast eviction allows for quicker reuse of buffer pool space, writing back dirty pages ensures data integrity. To mitigate the problem of unnecessary page writes, the concept of background writing can be employed. In background writing, the DBMS periodically scans the page table and writes dirty pages to disk. This approach helps avoid the need to write out pages unnecessarily, improving efficiency and reducing overhead in buffer pool management.

## Conclusion

In conclusion, managing memory efficiently in a database management system (DBMS) is crucial for optimizing performance. The buffer pool acts as a cache in memory, storing pages retrieved from disk. When a page is requested, the DBMS checks the buffer pool first and fetches the page from disk if it's not found. To protect internal data structures, DBMSs use latches, which are low-level protection primitives.

Optimizing the buffer pool may involve applying one of several techniques like multiple pools, pre-fetching pages based on query plans, sharing scanned data between queries, and bypassing the buffer pool for specific operations. These techniques improve data locality, reduce wait times, and enhance query performance.

Choosing the right replacement policy for evicting pages from the buffer pool is important. The Least Recently Used (LRU) and Clock policies are commonly used but can suffer from issues like sequential flooding. Solutions like LRU-K, localization per query, and priority hints offer more accurate and efficient eviction decisions.

Handling dirty pages involves either fast eviction of clean pages or writing back modified pages to disk for durability. Background writing helps minimize unnecessary page writes and reduces overhead in buffer pool management.

By implementing these memory management strategies, DBMSs can minimize disk I/O and optimize data access, resulting in improved overall performance and responsiveness.

## Resources

* [**Memory Management + Buffer Cache (CMU Intro to Database Systems / Fall 2022)**](https://youtu.be/Y9H2HaRKOIw)
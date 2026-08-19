---
title: "SQL IN 与 EXISTS 的理解"
description: "理解 SQL IN 与 EXISTS 用于优化 SQL 语句"
pubDate: "2026-08-18"
---

> 本文记录对 SQL IN 与 EXISTS 的理解。

## 1. 起因

最近阅读了一篇名为 **IN 子查询优化** 的文章，记录一下对那篇文章的个人见解。

> 文章链接：[IN子查询优化](https://mp.weixin.qq.com/s?__biz=MzkyODM0NzE1Ng==&mid=2247483866&idx=1&sn=b91276cf5348ae7e14eb8a9b93664994&chksm=c21b64a1f56cedb72b2828f6abc115ea4fb06d030b84453b0256f5b108e50727e3386bd0978a&cur_album_id=2758848643067101184&scene=189#wechat_redirect)

## 2. 逻辑与理解

IN 与 EXISTS 执行逻辑区别：

```text
IN：判断值是否在集合中
EXISTS：判断记录是否存在
```

查询定义：

```text
m = 外层表行数（customer）
n = 子查询结果行数（orders）
```

IN 查询 SQL：

```sql
SELECT *
FROM customer
WHERE c_custkey IN (
    SELECT DISTINCT o_custkey
    FROM orders
);
```

理解 SQL：

```text
第一步：
扫描 orders，取出所有 o_custkey

第二步：
去重

第三步：
遍历 customer
判断 customer.c_custkey 是否在集合中
```

EXISTS 查询 SQL：

```sql
SELECT *
FROM customer c
WHERE EXISTS (
    SELECT 1
    FROM orders o
    WHERE c.c_custkey = o.o_custkey
);
```

理解 SQL：

```text
for customer in customers:          -- m 次
    for order in orders:            -- 最坏 n 次
        if customer.id == order.customer_id:
            return customer


for 每一行 customer:

    去 orders 查询

    如果找到：
        返回 customer
```

这里要区分两种情况，一种是子查询未命中索引，一种是子查询命中索引。

我的理解是：

```text
在特定执行算法下

未建立索引：
IN 总复杂度 O(n log n + m log n)
EXISTS 总复杂度 O(mn)

建立索引：
IN 总复杂度 O(m log n)
EXISTS 总复杂度 O(m log n)
```

> IN / EXISTS 重点在于是否命中索引。

> 现代 SQL Server/MySQL/PostgreSQL 优化器中，数据库可以根据索引和统计信息采用最优的执行计划。

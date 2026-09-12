---
title: Ceph 分布式存储系统：架构、实践与竞品分析
abbrlink: ceph-distributed-storage
date: 2026-05-09 14:00:00
updated: 2026-05-09 14:00:00
description: "深入解析 Ceph 分布式存储系统的核心架构、部署实践、使用场景，以及与 MinIO、GlusterFS、HDFS 等竞品的对比分析。"
cover: "/img/default.png"
tags:
  - Ceph
  - 分布式存储
  - 对象存储
  - 块存储
  - 云原生
categories:
  - 后端架构
keywords:
  - Ceph
  - 分布式存储
  - 对象存储
  - 块存储
  - 文件系统
  - 存储架构
---

## 前言

在分布式系统中，存储是一个核心问题。当数据量从 GB 级增长到 TB、PB 级，单机存储已经无法满足需求，我们需要一个**高可用、高扩展、高性能**的分布式存储方案。

Ceph 是目前最流行的开源分布式存储系统之一，被 Red Hat、Canonical 等公司广泛采用，也是 OpenStack、Kubernetes 等云平台的首选存储后端。

本文将从**问题背景、架构设计、部署实践、竞品对比**四个维度，深入解析 Ceph。

---

## 一、Ceph 解决了什么问题？

### 1.1 传统存储的痛点

| 问题 | 说明 |
|------|------|
| **单点故障** | 传统 NAS/SAN 存储，控制器故障导致服务不可用 |
| **扩展性差** | 存储容量受限于单机硬件，扩容需要停机迁移 |
| **成本高昂** | 商业存储设备价格昂贵，license 费用持续支出 |
| **数据孤岛** | 不同业务使用不同存储系统，数据无法互通 |
| **运维复杂** | 存储管理需要专业团队，故障恢复依赖厂商支持 |

### 1.2 Ceph 的核心价值

```
Ceph = 统一存储 + 无中心架构 + 自动愈合 + 弹性扩展
```

**Ceph 提供三种存储接口：**

| 存储类型 | 接口 | 典型场景 |
|----------|------|----------|
| **对象存储 (RADOS Gateway)** | S3/Swift 兼容 API | 图片、视频、日志、备份 |
| **块存储 (RBD)** | 内核模块 / QEMU | 虚拟机磁盘、数据库存储 |
| **文件系统 (CephFS)** | POSIX 兼容 | 共享文件系统、HPC |

**核心优势：**
- ✅ **无单点故障**：去中心化架构，任意节点故障不影响服务
- ✅ **线性扩展**：添加节点即可扩展容量和性能
- ✅ **自动愈合**：数据副本自动修复，无需人工干预
- ✅ **统一存储**：一套系统支持对象、块、文件三种接口
- ✅ **开源免费**：社区活跃，无 license 费用

---

## 二、Ceph 怎么解决这些问题？

### 2.1 核心架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   RBD       │  │   CephFS    │  │   RGW       │         │
│  │ (块存储)    │  │ (文件系统)  │  │ (对象存储)  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      RADOS Layer                            │
│              (Reliable Autonomic Distributed Object Store)  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    CRUSH 算法                        │   │
│  │         (数据分布、故障域、副本放置)                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │   OSD   │  │   OSD   │  │   OSD   │  │   OSD   │       │
│  │ (磁盘)  │  │ (磁盘)  │  │ (磁盘)  │  │ (磁盘)  │       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Monitor Layer                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │  MON-1  │  │  MON-2  │  │  MON-3  │                     │
│  │ (仲裁)  │  │ (仲裁)  │  │ (仲裁)  │                     │
│  └─────────┘  └─────────┘  └─────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 核心组件

| 组件 | 说明 | 部署建议 |
|------|------|----------|
| **OSD (Object Storage Daemon)** | 管理单块磁盘，处理数据读写、复制、恢复 | 每块磁盘一个 OSD，建议 SSD + HDD 混合 |
| **MON (Monitor)** | 维护集群状态、OSD Map、PG Map | 3-5 个节点，奇数个，独立部署 |
| **MDS (Metadata Server)** | 管理 CephFS 元数据 | 2+ 个节点，Active/Standby 模式 |
| **RGW (RADOS Gateway)** | 提供 S3/Swift 兼容 API | 2+ 个节点，负载均衡 |
| **MGR (Manager)** | 提供集群监控、管理接口 | 2 个节点，Active/Standby 模式 |

### 2.3 CRUSH 算法：数据分布的核心

**CRUSH (Controlled Replication Under Scalable Hashing)** 是 Ceph 的核心算法，解决数据如何分布在集群中。

```
Object → HASH → PG (Placement Group) → CRUSH → OSD
```

**CRUSH 的核心优势：**

1. **去中心化**：不需要中心化的元数据服务器
2. **确定性**：相同输入总是映射到相同位置
3. **可配置**：支持故障域（机架、机房、数据中心）
4. **动态调整**：添加/删除节点时，只迁移部分数据

**故障域示例：**

```
Datacenter → Room → Row → Rack → Host → OSD
```

当配置了机架级故障域时，数据副本会分布在不同机架，即使整个机架故障，数据仍然可用。

### 2.4 数据一致性：Peering 机制

Ceph 使用 **Peering** 机制保证数据一致性：

```
Primary OSD ←→ Replica OSDs
     │
     ├── 1. 选举 Primary OSD
     ├── 2. 比较 OSD 日志
     ├── 3. 发现差异对象
     ├── 4. 修复不一致数据
     └── 5. 标记 PG 为 active
```

**PG 状态：**
- `creating`：PG 正在创建
- `active`：PG 可用，可以处理读写
- `clean`：所有副本一致
- `degraded`：部分副本缺失，正在恢复
- `recovering`：正在恢复数据
- `backfill`：正在后台迁移数据

---

## 三、Ceph 怎么使用？

### 3.1 部署架构

**推荐的最小生产环境：**

```
┌─────────────────────────────────────────────────────────┐
│                    Ceph Cluster                         │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Node-1    │  │   Node-2    │  │   Node-3    │     │
│  │             │  │             │  │             │     │
│  │  MON + MGR  │  │  MON + MGR  │  │  MON + MGR  │     │
│  │  OSD x3     │  │  OSD x3     │  │  OSD x3     │     │
│  │  MDS        │  │  MDS        │  │  MDS        │     │
│  │  RGW        │  │  RGW        │  │  RGW        │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                         │
│  总计：3 MON, 3 MGR, 9 OSD, 3 MDS, 3 RGW               │
└─────────────────────────────────────────────────────────┘
```

**硬件配置建议：**

| 角色 | CPU | 内存 | 磁盘 | 网络 |
|------|-----|------|------|------|
| **MON/MGR** | 4 核 | 8GB | 100GB SSD | 1GbE |
| **OSD** | 4 核/每块磁盘 | 4GB/每块磁盘 | 数据盘 HDD + WAL SSD | 10GbE |
| **MDS** | 8 核 | 16GB | 200GB SSD | 10GbE |
| **RGW** | 8 核 | 16GB | 100GB SSD | 10GbE |

### 3.2 使用 cephadm 部署（推荐）

```bash
# 1. 安装 cephadm
curl --silent --remote-name --location https://github.com/ceph/ceph/raw/quincy/src/cephadm/cephadm
chmod +x cephadm
sudo ./cephadm install

# 2. 引导第一个节点
sudo cephadm bootstrap --mon-ip 192.168.1.10 --cluster-network 192.168.2.0/24

# 3. 添加其他节点
sudo ceph orch host add node2 192.168.1.11
sudo ceph orch host add node3 192.168.1.12

# 4. 添加 OSD（自动发现磁盘）
sudo ceph orch apply osd --all-available-devices

# 5. 查看集群状态
sudo ceph -s
sudo ceph osd tree
sudo ceph pg stat
```

### 3.3 使用 RBD 块存储

```bash
# 创建存储池
sudo ceph osd pool create rbd-pool 128

# 启用 RBD
sudo rbd pool init rbd-pool

# 创建 RBD 镜像
sudo rbd create rbd-pool/vm-disk --size 102400  # 100GB

# 映射到本地
sudo rbd map rbd-pool/vm-disk

# 格式化并挂载
sudo mkfs.ext4 /dev/rbd0
sudo mount /dev/rbd0 /mnt/rbd

# 查看 RBD 镜像
sudo rbd ls rbd-pool
sudo rbd info rbd-pool/vm-disk
```

### 3.4 使用 RADOS Gateway (S3)

```bash
# 创建 RGW 用户
sudo radosgw-admin user create --uid="testuser" --display-name="Test User"

# 输出包含 access_key 和 secret_key
{
    "user_id": "testuser",
    "display_name": "Test User",
    "keys": [
        {
            "user": "testuser",
            "access_key": "XXXXXXXXXXXXXXXXXXXX",
            "secret_key": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        }
    ]
}

# 使用 AWS CLI 访问
aws configure set aws_access_key_id "XXXXXXXXXXXXXXXXXXXX"
aws configure set aws_secret_access_key "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
aws configure set default.region "default"

# 创建 bucket
aws --endpoint-url http://rgw-node:8080 s3 mb s3://my-bucket

# 上传文件
aws --endpoint-url http://rgw-node:8080 s3 cp file.txt s3://my-bucket/

# 列出文件
aws --endpoint-url http://rgw-node:8080 s3 ls s3://my-bucket/
```

### 3.5 使用 CephFS 文件系统

```bash
# 创建 CephFS 数据池和元数据池
sudo ceph osd pool create cephfs-data 128
sudo ceph osd pool create cephfs-metadata 128

# 创建 CephFS
sudo ceph fs new cephfs cephfs-metadata cephfs-data

# 安装 CephFS 客户端
sudo apt install ceph-fuse

# 挂载 CephFS
sudo ceph-fuse -m 192.168.1.10:6789 /mnt/cephfs

# 或者使用内核挂载
sudo mount -t ceph 192.168.1.10:6789:/ /mnt/cephfs -o name=admin,secretfile=/etc/ceph/admin.secret
```

### 3.6 Kubernetes 集成

```yaml
# StorageClass for RBD
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ceph-rbd
provisioner: rbd.csi.ceph.com
parameters:
  clusterID: <cluster-id>
  pool: rbd-pool
  imageFeatures: layering
  csi.storage.k8s.io/provisioner-secret-name: csi-rbd-secret
  csi.storage.k8s.io/provisioner-secret-namespace: ceph-csi
  csi.storage.k8s.io/node-stage-secret-name: csi-rbd-secret
  csi.storage.k8s.io/node-stage-secret-namespace: ceph-csi
reclaimPolicy: Delete
allowVolumeExpansion: true
mountOptions:
  - discard
```

```yaml
# PVC 使用 Ceph RBD
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ceph-rbd-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: ceph-rbd
```

---

## 四、竞品分析

### 4.1 分布式存储系统对比

| 特性 | Ceph | MinIO | GlusterFS | HDFS | SeaweedFS |
|------|------|-------|-----------|------|-----------|
| **存储类型** | 对象/块/文件 | 对象 | 文件 | 文件 | 对象 |
| **协议** | S3/Swift/RBD/CephFS | S3 | NFS/Gluster | HDFS API | HTTP API |
| **元数据** | 去中心化 (CRUSH) | 去中心化 | 去中心化 | 中心化 (NameNode) | 中心化 (Master) |
| **数据一致性** | 强一致 | 强一致 | 最终一致 | 强一致 | 最终一致 |
| **小文件优化** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐ | ⭐⭐⭐⭐ |
| **大文件优化** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **部署复杂度** | 高 | 低 | 中 | 高 | 低 |
| **运维复杂度** | 高 | 低 | 中 | 高 | 低 |
| **社区活跃度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **生产案例** | Red Hat, Canonical | 云原生 | 企业 NAS | Hadoop 生态 | 小规模部署 |

### 4.2 详细对比分析

#### Ceph vs MinIO

| 维度 | Ceph | MinIO |
|------|------|-------|
| **定位** | 统一存储平台 | 专注对象存储 |
| **优势** | 支持多种存储接口，功能全面 | 轻量级，部署简单，S3 兼容性好 |
| **劣势** | 部署复杂，运维成本高 | 只支持对象存储，无块/文件支持 |
| **适用场景** | 需要统一存储的企业级场景 | 纯对象存储场景，云原生环境 |

**选型建议：**
- 如果只需要 S3 对象存储 → **MinIO**
- 如果需要块存储/文件系统 → **Ceph**
- 如果运维能力有限 → **MinIO**

#### Ceph vs GlusterFS

| 维度 | Ceph | GlusterFS |
|------|------|-----------|
| **定位** | 统一存储平台 | 分布式文件系统 |
| **优势** | 功能全面，强一致性 | 部署简单，POSIX 兼容性好 |
| **劣势** | 部署复杂 | 无块存储/对象存储支持 |
| **元数据** | 去中心化 | 去中心化 |
| **适用场景** | 需要多种存储接口 | 纯文件共享场景 |

**选型建议：**
- 如果需要 NFS 替代方案 → **GlusterFS**
- 如果需要块存储/对象存储 → **Ceph**
- 如果追求简单易用 → **GlusterFS**

#### Ceph vs HDFS

| 维度 | Ceph | HDFS |
|------|------|------|
| **定位** | 通用存储平台 | 大数据存储 |
| **优势** | 支持多种接口，随机读写 | 大文件顺序读写性能高 |
| **劣势** | 小文件性能差 | 只支持文件，单点故障 (NameNode) |
| **适用场景** | 通用存储 | Hadoop/Spark 生态 |

**选型建议：**
- 如果是 Hadoop/Spark 生态 → **HDFS**
- 如果需要通用存储 → **Ceph**
- 如果需要对象存储 → **Ceph**

### 4.3 选型决策树

```
你的存储需求是什么？
│
├── 需要对象存储 (S3)
│   ├── 只需要对象存储 → MinIO
│   └── 还需要块/文件 → Ceph
│
├── 需要块存储 (VM/数据库)
│   └── Ceph (RBD)
│
├── 需要文件系统 (共享存储)
│   ├── NFS 替代 → GlusterFS
│   └── 高性能需求 → CephFS
│
└── 需要大数据存储
    ├── Hadoop/Spark 生态 → HDFS
    └── 通用存储 → Ceph
```

---

## 五、生产环境最佳实践

### 5.1 性能优化

**1. 分层存储 (Tiering)**

```
SSD Pool (热数据) ←→ Cache Tier ←→ HDD Pool (冷数据)
```

```bash
# 创建缓存池
sudo ceph osd pool create cache-pool 128
sudo ceph osd pool create cold-pool 128

# 设置缓存层
sudo ceph tier add cold-pool cache-pool
sudo ceph tier cache-mode cache-pool writeback

# 设置缓存规则
sudo ceph osd pool set cache-pool hit_set_type bloom
sudo ceph osd pool set cache-pool hit_set_count 1
sudo ceph osd pool set cache-pool hit_set_period 3600
sudo ceph osd pool set cache-pool target_max_bytes 100000000000  # 100GB
```

**2. 纠删码 (Erasure Coding)**

纠删码可以用更少的存储空间提供相同的数据可靠性。

```bash
# 创建纠删码池
sudo ceph osd pool create ec-pool 128 erasure

# 默认 profile：k=2, m=1 (3份数据，占用 1.5 倍空间)
# 自定义 profile
sudo ceph osd erasure-code-profile set my-profile k=4 m=2 crush-failure-domain=rack
sudo ceph osd pool create ec-pool 128 erasure my-profile
```

**纠删码 vs 副本：**

| 策略 | 存储开销 | 可靠性 | 性能 |
|------|----------|--------|------|
| 3 副本 | 3x | 高 | 高 |
| 纠删码 4+2 | 1.5x | 高 | 中 |

### 5.2 监控告警

```bash
# 查看集群状态
sudo ceph -s
sudo ceph health detail

# 查看 OSD 状态
sudo ceph osd tree
sudo ceph osd stat

# 查看 PG 状态
sudo ceph pg stat
sudo ceph pg dump

# 查看性能指标
sudo ceph osd pool stats
sudo ceph osd perf
```

**推荐监控工具：**
- **Ceph Dashboard**：官方 Web 管理界面
- **Prometheus + Grafana**：指标采集和可视化
- **Zabbix**：企业级监控告警

### 5.3 备份恢复

```bash
# RBD 快照
sudo rbd snap create rbd-pool/vm-disk@snap1
sudo rbd snap ls rbd-pool/vm-disk

# RBD 导出
sudo rbd export rbd-pool/vm-disk /backup/vm-disk.img

# RBD 导入
sudo rbd import /backup/vm-disk.img rbd-pool/vm-disk-restored

# RADOS 导出
sudo rados -p rbd-pool export /backup/rados-export
sudo rados -p rbd-pool import /backup/rados-export
```

---

## 六、常见问题与解决方案

### 6.1 OSD 频繁宕机

**原因：**
- 磁盘故障
- 内存不足
- 网络抖动

**解决方案：**
```bash
# 查看 OSD 日志
sudo journalctl -u ceph-osd@<osd-id>

# 检查磁盘健康
sudo smartctl -a /dev/sdX

# 调整 OSD 参数
sudo ceph config set osd osd_heartbeat_grace 60
sudo ceph config set osd osd_heartbeat_interval 10
```

### 6.2 集群空间不足

**解决方案：**
```bash
# 查看空间使用
sudo ceph df
sudo ceph osd df

# 清理已删除的对象
sudo rados -p rbd-pool cleanup

# 调整副本数
sudo ceph osd pool set rbd-pool size 2

# 使用纠删码
sudo ceph osd pool create ec-pool 128 erasure
```

### 6.3 性能问题

**排查步骤：**
```bash
# 查看 IO 统计
sudo ceph osd perf

# 查看慢请求
sudo ceph daemon osd.<id> dump_ops_in_flight

# 查看网络延迟
sudo ceph daemon mon.<id> perf dump
```

---

## 七、Java / Python 实战

本节介绍如何用 Java 和 Python 操作 Ceph 的三大存储接口：RADOS Gateway (S3)、RBD (librados)、CephFS。

### 7.1 Python 访问 RADOS Gateway (S3 兼容)

RADOS Gateway (RGW) 兼容 AWS S3 协议，可直接使用 `boto3` 访问，这也是**最推荐**的 Python 接入方式。

#### 安装依赖

```bash
pip install boto3
```

#### 基础操作：Bucket 与 Object

```python
import boto3
from botocore.client import Config

# 创建 S3 客户端（指向 Ceph RGW）
s3 = boto3.client(
    's3',
    endpoint_url='http://rgw-node:8080',        # RGW 地址
    aws_access_key_id='YOUR_ACCESS_KEY',
    aws_secret_access_key='YOUR_SECRET_KEY',
    config=Config(signature_version='s3v4'),     # 强制使用 v4 签名
    region_name='default'
)

# --- Bucket 操作 ---
s3.create_bucket(Bucket='my-data-lake')
print("Buckets:", [b['Name'] for b in s3.list_buckets()['Buckets']])

# --- 上传文件 ---
s3.upload_file('/local/path/data.csv', 'my-data-lake', 'data/raw/data.csv')

# --- 流式上传（适合大文件 / 内存数据） ---
from io import BytesIO
data = b'{"logs": [...]}'
s3.upload_fileobj(BytesIO(data), 'my-data-lake', 'logs/app.json')

# --- 下载文件 ---
s3.download_file('my-data-lake', 'data/raw/data.csv', '/local/path/download.csv')

# --- 列出对象（支持前缀过滤） ---
response = s3.list_objects_v2(Bucket='my-data-lake', Prefix='data/')
for obj in response.get('Contents', []):
    print(f"  {obj['Key']}  size={obj['Size']}  modified={obj['LastModified']}")

# --- 删除对象 ---
s3.delete_object(Bucket='my-data-lake', Key='logs/app.json')
```

#### 分片上传（大文件 >5GB）

```python
# boto3 内置分片上传，自动处理
from boto3.s3.transfer import TransferConfig

config = TransferConfig(
    multipart_threshold=1024 * 256,  # 256KB 以上启用分片
    max_concurrency=10,
    multipart_chunksize=1024 * 1024 * 100  # 每片 100MB
)
s3.upload_file('/local/path/huge-video.mp4', 'my-data-lake',
               'videos/huge-video.mp4', Config=config)
```

#### 预签名 URL（临时授权访问）

```python
# 生成预签名 URL，有效期 3600 秒
url = s3.generate_presigned_url(
    'get_object',
    Params={'Bucket': 'my-data-lake', 'Key': 'data/raw/data.csv'},
    ExpiresIn=3600
)
print("Download URL:", url)
# 分发给前端 / 第三方，无需暴露 AK/SK
```

### 7.2 Python 直接访问 librados（底层 RADOS）

当需要**极致低延迟**或操作 RBD 镜像内部数据时，可使用 `python-rados` 直连集群。

#### 安装依赖

```bash
# 系统依赖（以 Ubuntu 为例）
sudo apt install python3-rados

# 或使用 pip（需要先安装 ceph-dev 包）
pip install rados
```

#### 连接集群与 IO 操作

```python
import rados

# 1. 创建集群连接
cluster = rados.Rados(conffile='/etc/ceph/ceph.conf')
cluster.connect()
print("Cluster ID:", cluster.get_fsid())

# 2. 打开存储池
ioctx = cluster.open_ioctx('my-pool')

# 3. 写入对象
ioctx.write_full('hello-obj', b'Hello Ceph from Python!')
ioctx.write('large-obj', b'partial data...', offset=1024)

# 4. 读取对象
data = ioctx.read('hello-obj', length=1024)
print("Read:", data.decode())

# 5. 对象属性 (xattr)
ioctx.set_xattr('hello-obj', 'content-type', b'text/plain')
ct = ioctx.get_xattr('hello-obj', 'content-type')
print("Xattr:", ct.decode())

# 6. 对象统计
stat = ioctx.stat('hello-obj')
print(f"Size: {stat[0]}, Mtime: {stat[1]}")

# 7. 列举对象
object_iterator = ioctx.list_objects()
for obj in object_iterator:
    print(f"  {obj.key}")

# 8. 清理
ioctx.close()
cluster.shutdown()
```

#### 操作 RBD 镜像

```python
import rbd

# 创建 RBD 句柄
ioctx = cluster.open_ioctx('rbd-pool')
rbd_inst = rbd.RBD()

# 列出镜像
images = rbd_inst.list(ioctx)
print("RBD Images:", images)

# 创建镜像
rbd_inst.create(ioctx, 'new-disk', size=10 * 1024**3)  # 10GB

# 打开镜像并读写
image = rbd.Image(ioctx, 'new-disk')
image.write(b'Ceph RBD data', offset=0)
data = image.read(0, 13)
print("RBD read:", data.decode())

# 创建快照
image.create_snap('backup-snap')
image.close()
```

### 7.3 Java 访问 RADOS Gateway (S3 兼容)

Java 生态推荐使用 **AWS SDK v2**（`software.amazon.awssdk`），Ceph RGW 完全兼容 S3 协议。

#### Maven 依赖

```xml
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>s3</artifactId>
    <version>2.25.0</version>
</dependency>
<!-- URL 连接所需的 CRT 传输 -->
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>s3-transfer-manager</artifactId>
    <version>2.25.0</version>
</dependency>
```

#### 基础操作封装

```java
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.S3Configuration;

import java.net.URI;
import java.nio.file.Paths;

public class CephS3Client {

    private final S3Client s3;

    public CephS3Client(String endpoint, String accessKey, String secretKey) {
        this.s3 = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .region(Region.of("default"))
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)       // Ceph RGW 必须使用 path-style
                        .chunkedEncodingEnabled(false)      // 部分 RGW 版本需要关闭
                        .build())
                .build();
    }

    // --- 创建 Bucket ---
    public void createBucket(String bucket) {
        s3.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
        System.out.println("Bucket created: " + bucket);
    }

    // --- 上传文件 ---
    public void uploadFile(String bucket, String key, String localPath) {
        s3.putObject(PutObjectRequest.builder()
                        .bucket(bucket).key(key).build(),
                Paths.get(localPath));
        System.out.println("Uploaded: " + key);
    }

    // --- 上传字节数组 ---
    public void uploadBytes(String bucket, String key, byte[] data, String contentType) {
        s3.putObject(PutObjectRequest.builder()
                        .bucket(bucket).key(key)
                        .contentType(contentType).build(),
                RequestBody.fromBytes(data));
    }

    // --- 下载文件 ---
    public void downloadFile(String bucket, String key, String localPath) {
        s3.getObject(GetObjectRequest.builder()
                        .bucket(bucket).key(key).build(),
                Paths.get(localPath));
        System.out.println("Downloaded: " + key);
    }

    // --- 列出对象 ---
    public void listObjects(String bucket, String prefix) {
        ListObjectsV2Response response = s3.listObjectsV2(
                ListObjectsV2Request.builder()
                        .bucket(bucket).prefix(prefix).build());
        for (S3Object obj : response.contents()) {
            System.out.printf("  %s  size=%d  modified=%s%n",
                    obj.key(), obj.size(), obj.lastModified());
        }
    }

    // --- 删除对象 ---
    public void deleteObject(String bucket, String key) {
        s3.deleteObject(DeleteObjectRequest.builder()
                .bucket(bucket).key(key).build());
    }

    // --- 生成预签名 URL ---
    public String presignedUrl(String bucket, String key) {
        // 需要引入 presigned-url 模块，见下方
        return "TODO";
    }

    public void close() {
        s3.close();
    }

    // --- 使用示例 ---
    public static void main(String[] args) {
        CephS3Client client = new CephS3Client(
                "http://rgw-node:8080",
                "YOUR_ACCESS_KEY",
                "YOUR_SECRET_KEY"
        );

        client.createBucket("java-data-lake");
        client.uploadFile("java-data-lake", "config/app.yaml", "/etc/app/config.yaml");
        client.listObjects("java-data-lake", "");
        client.close();
    }
}
```

#### 预签名 URL（Java）

```xml
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>presigned-url</artifactId>
    <version>2.25.0</version>
</dependency>
```

```java
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

S3Presigner presigner = S3Presigner.builder()
        .endpointOverride(URI.create("http://rgw-node:8080"))
        .credentialsProvider(StaticCredentialsProvider.create(
                AwsBasicCredentials.create("ACCESS_KEY", "SECRET_KEY")))
        .region(Region.of("default"))
        .build();

String url = presigner.presignGetObject(GetObjectPresignRequest.builder()
        .signatureDuration(Duration.ofHours(1))
        .getObjectRequest(GetObjectRequest.builder()
                .bucket("java-data-lake").key("report.pdf").build())
        .build()).url().toString();

System.out.println("Download URL: " + url);
```

### 7.4 Java 直接访问 librados（jRados）

对于需要**低延迟直连 Ceph 集群**的场景（如实时数据分析、RBD 内部操作），可使用 **jRados** Java 绑定。

#### 安装 jRados

```bash
# 编译安装（需要先安装 librados-dev）
git clone https://github.com/ceph/jrados.git
cd jrados
mvn clean install

# 或使用 Ceph 自带的 Java 绑定
sudo apt install librados-dev librados2
# 编译 Java binding
cd /usr/share/ceph/java
javac -cp . *.java
jar cf jrados.jar *.class
```

#### Maven 依赖（自建）

```xml
<dependency>
    <groupId>org.ceph</groupId>
    <artifactId>jrados</artifactId>
    <version>1.0.0</version>
    <scope>system</scope>
    <systemPath>${project.basedir}/lib/jrados.jar</systemPath>
</dependency>
```

#### 基础操作

```java
import org.ceph.rados.Rados;
import org.ceph.rados.IoCTX;
import org.ceph.rados.jna.RadosObjectInfo;

public class CephRadosClient {

    public static void main(String[] args) throws Exception {
        // 1. 创建 Rados 句柄
        Rados rados = new Rados("admin");  // Ceph 用户名
        rados.confReadFile(new java.io.File("/etc/ceph/ceph.conf"));
        rados.connect();

        System.out.println("Cluster FSID: " + rados.getFsid());

        // 2. 打开存储池
        IoCTX ioctx = rados.ioCtxCreate("my-pool");

        // 3. 写入对象
        byte[] data = "Hello from Java!".getBytes();
        ioctx.write("java-obj", data, data.length, 0);

        // 4. 读取对象
        byte[] buffer = new byte[1024];
        int bytesRead = ioctx.read("java-obj", buffer, buffer.length, 0);
        System.out.println("Read: " + new String(buffer, 0, bytesRead));

        // 5. 对象属性 (xattr)
        ioctx.setxattr("java-obj", "author", "java-app".getBytes());
        byte[] xattrBuf = new byte[64];
        int xattrLen = ioctx.getxattr("java-obj", "author", xattrBuf, xattrBuf.length);
        System.out.println("Xattr: " + new String(xattrBuf, 0, xattrLen));

        // 6. 对象信息
        RadosObjectInfo info = ioctx.stat("java-obj");
        System.out.println("Size: " + info.size);

        // 7. 清理
        rados.ioCtxDestroy(ioctx);
        rados.shutdown();
    }
}
```

#### Spring Boot 集成示例

```java
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

@Service
public class CephStorageService {

    private final S3Client s3;
    private final String defaultBucket;

    public CephStorageService(S3Client s3,
                               @Value("${ceph.bucket}") String defaultBucket) {
        this.s3 = s3;
        this.defaultBucket = defaultBucket;
    }

    /** 上传业务数据 */
    public void upload(String key, byte[] data) {
        s3.putObject(PutObjectRequest.builder()
                        .bucket(defaultBucket).key(key).build(),
                RequestBody.fromBytes(data));
    }

    /** 下载业务数据 */
    public byte[] download(String key) {
        return s3.getObjectAsBytes(GetObjectRequest.builder()
                        .bucket(defaultBucket).key(key).build())
                .asByteArray();
    }

    /** 检查对象是否存在 */
    public boolean exists(String key) {
        try {
            s3.headObject(HeadObjectRequest.builder()
                    .bucket(defaultBucket).key(key).build());
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        }
    }
}
```

```yaml
# application.yml
ceph:
  endpoint: http://rgw-node:8080
  access-key: ${CEPH_ACCESS_KEY}    # 从环境变量读取
  secret-key: ${CEPH_SECRET_KEY}
  bucket: business-data
  region: default
```

```java
// CephConfig.java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

@Configuration
public class CephConfig {

    @Bean
    public S3Client cephS3Client(
            @Value("${ceph.endpoint}") String endpoint,
            @Value("${ceph.access-key}") String accessKey,
            @Value("${ceph.secret-key}") String secretKey,
            @Value("${ceph.region}") String region) {

        return S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .region(Region.of(region))
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                .build();
    }
}
```

### 7.5 Java / Python 操作 CephFS

CephFS 可通过 `libcephfs` 的 Java/Python 绑定访问，但对于大多数业务场景，**直接 NFS 挂载 CephFS 后用标准文件 IO 操作更简单**。

```python
# Python 方式：挂载后直接读写（推荐）
import os
import shutil

# 假设 CephFS 已挂载到 /mnt/cephfs
cephfs_root = '/mnt/cephfs'

# 读写文件（和本地文件系统完全一致）
with open(os.path.join(cephfs_root, 'data', 'report.txt'), 'w') as f:
    f.write('CephFS content from Python')

# 列目录
for item in os.listdir(os.path.join(cephfs_root, 'data')):
    print(item)

# 递归遍历
for root, dirs, files in os.walk(cephfs_root):
    for f in files:
        print(os.path.join(root, f))
```

```java
// Java 方式：挂载后用 NIO 操作（推荐）
import java.nio.file.*;
import java.nio.charset.StandardCharsets;

Path cephfsRoot = Paths.get("/mnt/cephfs");

// 写文件
Files.write(cephfsRoot.resolve("data/report.txt"),
        "CephFS content from Java".getBytes(StandardCharsets.UTF_8));

// 读文件
byte[] content = Files.readAllBytes(cephfsRoot.resolve("data/report.txt"));

// 列目录
try (var stream = Files.list(cephfsRoot.resolve("data"))) {
    stream.forEach(System.out::println);
}
```

### 7.6 SDK / 库速查表

| 语言 | 库 | 安装 | 支持接口 | 适用场景 |
|------|-----|------|----------|----------|
| **Python** | `boto3` | `pip install boto3` | S3/RGW | 对象存储（推荐） |
| **Python** | `python-rados` | `apt install python3-rados` | librados / RBD | 底层直连 |
| **Python** | `minio` | `pip install minio` | S3/RGW | 对象存储（轻量） |
| **Java** | AWS SDK v2 | Maven `software.amazon.awssdk:s3` | S3/RGW | 对象存储（推荐） |
| **Java** | `jRados` | 编译安装 | librados / RBD | 底层直连 |
| **Java** | `minio-java` | Maven `io.minio:minio` | S3/RGW | 对象存储（轻量） |

---

## 总结

Ceph 是一个功能强大的分布式存储系统，适合需要**统一存储、高可用、弹性扩展**的企业级场景。

**适用场景：**
- ✅ 云平台存储后端（OpenStack、Kubernetes）
- ✅ 虚拟化环境存储
- ✅ 大规模对象存储
- ✅ 需要块存储 + 文件系统的混合场景

**不适用场景：**
- ❌ 小规模部署（运维成本高）
- ❌ 纯对象存储场景（MinIO 更简单）
- ❌ 纯大数据场景（HDFS 更专业）

**选型建议：**
- 如果团队有存储运维能力，且需要统一存储 → **Ceph**
- 如果只需要 S3 对象存储 → **MinIO**
- 如果需要 NFS 替代 → **GlusterFS**
- 如果是 Hadoop 生态 → **HDFS**

---

## 参考资料

**官方文档：**
- [Ceph 官方文档](https://docs.ceph.com/)
- [Ceph 架构设计](https://ceph.io/en/architecture/)
- [CRUSH 算法论文](https://ceph.io/wp-content/uploads/2016/08/weil-crush-sc06.pdf)
- [Ceph 性能调优指南](https://docs.ceph.com/en/latest/rados/configuration/)

**Python SDK：**
- [boto3 S3 文档](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3.html)
- [python-rados API](https://docs.ceph.com/en/latest/rados/api/python/)
- [MinIO Python SDK](https://min.io/docs/minio/linux/developers/python/minio-py.html)

**Java SDK：**
- [AWS SDK for Java v2](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/home.html)
- [jRados GitHub](https://github.com/ceph/jrados)
- [MinIO Java SDK](https://min.io/docs/minio/linux/developers/java/minio-java.html)

---

*最后更新：2026-05-09*

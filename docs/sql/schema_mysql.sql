-- ============================================
-- 机场设备管理系统 - MySQL 数据库脚本
-- ============================================
-- 
-- 创建此脚本的命令：
-- mysql -u airport_admin -p airport_equipment < docs/schema_mysql.sql
-- 
-- 版本：1.0.0
-- 创建日期：2026年6月
-- 
-- 目录结构：
-- 1. 用户表
-- 2. 站点表
-- 3. 柜台表
-- 4. 设备类型表
-- 5. 设备表
-- 6. 设备更换记录表
-- 7. 换纸记录表
-- 8. 耗材记录表
-- 9. 系统审计日志表
-- 10. 视图（统计汇总）

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET COLLATION_CONNECTION = utf8mb4_unicode_ci;

-- ============================================
-- 1. 用户表
-- ============================================
-- 存储系统用户信息，支持管理员和普通用户两种角色

CREATE TABLE users (
    id CHAR(36) PRIMARY KEY COMMENT '用户ID (UUID)',
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码（bcrypt加密存储）',
    name VARCHAR(100) NOT NULL COMMENT '用户全名',
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user' COMMENT '用户角色',
    is_active BOOLEAN DEFAULT true COMMENT '是否激活',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    KEY idx_username (username),
    KEY idx_role (role),
    KEY idx_users_is_active (is_active),
    CONSTRAINT username_length CHECK (CHAR_LENGTH(username) >= 3),
    CONSTRAINT users_name_not_empty CHECK (CHAR_LENGTH(name) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 2. 站点表
-- ============================================
-- 存储机场站点信息，包括值机岛、登机口、自助服务区

CREATE TABLE stations (
    id CHAR(36) PRIMARY KEY COMMENT '站点ID (UUID)',
    name VARCHAR(100) NOT NULL COMMENT '站点名称',
    code VARCHAR(20) UNIQUE NOT NULL COMMENT '站点代码（如 A、B、GA）',
    type ENUM('checkin', 'gate', 'selfservice') NOT NULL COMMENT '站点类型',
    description TEXT COMMENT '站点描述',
    position_x INT DEFAULT 0 COMMENT 'X 坐标（用于可视化布局）',
    position_y INT DEFAULT 0 COMMENT 'Y 坐标（用于可视化布局）',
    is_active BOOLEAN DEFAULT true COMMENT '是否激活',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    KEY idx_code (code),
    KEY idx_type (type),
    KEY idx_stations_is_active (is_active),
    CONSTRAINT stations_name_not_empty CHECK (CHAR_LENGTH(name) > 0),
    CONSTRAINT stations_code_not_empty CHECK (CHAR_LENGTH(code) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='站点表';

-- ============================================
-- 3. 柜台表
-- ============================================
-- 存储站点下的柜台信息，支持值机岛和登机口柜台

CREATE TABLE counters (
    id CHAR(36) PRIMARY KEY COMMENT '柜台ID (UUID)',
    station_id CHAR(36) NOT NULL COMMENT '所属站点',
    name VARCHAR(100) NOT NULL COMMENT '柜台名称',
    position INT NOT NULL COMMENT '位置序号（同一站点内唯一）',
    is_active BOOLEAN DEFAULT true COMMENT '是否激活',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    KEY idx_station_id (station_id),
    KEY idx_name (name),
    UNIQUE KEY idx_unique_position (station_id, position),
    CONSTRAINT counters_station_id_fk FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
    CONSTRAINT counters_name_not_empty CHECK (CHAR_LENGTH(name) > 0),
    CONSTRAINT position_positive CHECK (position >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='柜台表';

-- ============================================
-- 4. 设备类型表
-- ============================================
-- 存储设备类型定义，支持自定义属性和图标

CREATE TABLE device_types (
    id CHAR(36) PRIMARY KEY COMMENT '设备类型ID (UUID)',
    name VARCHAR(100) UNIQUE NOT NULL COMMENT '设备类型名称',
    category VARCHAR(50) NOT NULL COMMENT '分类（如 CUSS、值机电脑、打印机等）',
    description TEXT COMMENT '描述',
    icon TEXT COMMENT '图标（支持内置图标名或自定义图片base64）',
    attributes JSON DEFAULT '{}' COMMENT '自定义属性 JSON',
    is_active BOOLEAN DEFAULT true COMMENT '是否激活',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    KEY idx_category (category),
    KEY idx_device_types_is_active (is_active),
    CONSTRAINT device_types_name_not_empty CHECK (CHAR_LENGTH(name) > 0),
    CONSTRAINT category_not_empty CHECK (CHAR_LENGTH(category) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备类型表';

-- ============================================
-- 5. 设备表
-- ============================================
-- 存储设备信息，支持备机（无站点）和在位设备

CREATE TABLE devices (
    id CHAR(36) PRIMARY KEY COMMENT '设备ID (UUID)',
    name VARCHAR(100) NOT NULL COMMENT '设备名称',
    type_id CHAR(36) NOT NULL COMMENT '设备类型',
    serial_number VARCHAR(50) UNIQUE NOT NULL COMMENT '序列号',
    status ENUM('active', 'standby', 'damaged', 'repair') NOT NULL DEFAULT 'standby' COMMENT '设备状态',
    station_id CHAR(36) COMMENT '所属站点（备机设备为NULL）',
    counter_id CHAR(36) COMMENT '所属柜台（可选）',
    position INT DEFAULT 0 COMMENT '位置序号',
    custom_data JSON DEFAULT '{}' COMMENT '自定义数据 JSON',
    notes TEXT COMMENT '备注',
    is_active BOOLEAN DEFAULT true COMMENT '是否激活',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    KEY idx_serial_number (serial_number),
    KEY idx_status (status),
    KEY idx_station_id (station_id),
    KEY idx_counter_id (counter_id),
    KEY idx_type_id (type_id),
    KEY idx_devices_is_active (is_active),
    KEY idx_devices_status_station (status, station_id),
    KEY idx_devices_status_type (status, type_id),
    CONSTRAINT devices_type_id_fk FOREIGN KEY (type_id) REFERENCES device_types(id) ON DELETE RESTRICT,
    CONSTRAINT devices_station_id_fk FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE SET NULL,
    CONSTRAINT devices_counter_id_fk FOREIGN KEY (counter_id) REFERENCES counters(id) ON DELETE SET NULL,
    CONSTRAINT devices_name_not_empty CHECK (CHAR_LENGTH(name) > 0),
    CONSTRAINT serial_number_not_empty CHECK (CHAR_LENGTH(serial_number) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备表';

-- ============================================
-- 6. 设备更换记录表
-- ============================================
-- 记录设备的移动和状态变更历史

CREATE TABLE device_change_records (
    id CHAR(36) PRIMARY KEY COMMENT '记录ID (UUID)',
    device_id CHAR(36) NOT NULL COMMENT '设备ID',
    from_station_id CHAR(36) COMMENT '源站点',
    to_station_id CHAR(36) COMMENT '目标站点',
    from_counter_id CHAR(36) COMMENT '源柜台',
    to_counter_id CHAR(36) COMMENT '目标柜台',
    from_status ENUM('active', 'standby', 'damaged', 'repair') COMMENT '原状态（NULL表示新增设备）',
    to_status ENUM('active', 'standby', 'damaged', 'repair') COMMENT '新状态（NULL表示删除设备）',
    reason VARCHAR(255) NOT NULL COMMENT '变更原因',
    operator_id CHAR(36) NOT NULL COMMENT '操作员ID',
    operator_name VARCHAR(100) NOT NULL COMMENT '操作员名称',
    notes TEXT COMMENT '备注',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '变更时间',
    
    KEY idx_device_id (device_id),
    KEY idx_operator_id (operator_id),
    KEY idx_created_at (created_at),
    CONSTRAINT device_change_records_device_id_fk FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    CONSTRAINT device_change_records_from_station_id_fk FOREIGN KEY (from_station_id) REFERENCES stations(id) ON DELETE SET NULL,
    CONSTRAINT device_change_records_to_station_id_fk FOREIGN KEY (to_station_id) REFERENCES stations(id) ON DELETE SET NULL,
    CONSTRAINT device_change_records_from_counter_id_fk FOREIGN KEY (from_counter_id) REFERENCES counters(id) ON DELETE SET NULL,
    CONSTRAINT device_change_records_to_counter_id_fk FOREIGN KEY (to_counter_id) REFERENCES counters(id) ON DELETE SET NULL,
    CONSTRAINT device_change_records_operator_id_fk FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备更换记录表';

-- ============================================
-- 7. 换纸记录表（CUSS 自助机）
-- ============================================
-- 记录 CUSS 自助机的耗材更换情况

CREATE TABLE paper_change_records (
    id CHAR(36) PRIMARY KEY COMMENT '记录ID (UUID)',
    device_id CHAR(36) NOT NULL COMMENT '设备ID',
    paper_type VARCHAR(50) NOT NULL COMMENT '纸张类型',
    quantity INT NOT NULL DEFAULT 1 COMMENT '数量',
    notes TEXT COMMENT '备注',
    operator_id CHAR(36) NOT NULL COMMENT '操作员ID',
    operator_name VARCHAR(100) NOT NULL COMMENT '操作员名称',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    KEY idx_paper_device_id (device_id),
    KEY idx_paper_operator_id (operator_id),
    KEY idx_paper_created_at (created_at),
    CONSTRAINT paper_change_records_device_id_fk FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    CONSTRAINT paper_change_records_operator_id_fk FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT paper_type_not_empty CHECK (CHAR_LENGTH(paper_type) > 0),
    CONSTRAINT quantity_positive CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='换纸记录表';

-- ============================================
-- 8. 耗材记录表
-- ============================================
-- 记录设备耗材更换情况（通用耗材）

CREATE TABLE consumable_records (
    id CHAR(36) PRIMARY KEY COMMENT '记录ID (UUID)',
    device_id CHAR(36) NOT NULL COMMENT '设备ID',
    consumable_type VARCHAR(50) NOT NULL COMMENT '耗材类型',
    quantity INT NOT NULL DEFAULT 1 COMMENT '数量',
    notes TEXT COMMENT '备注',
    operator_id CHAR(36) NOT NULL COMMENT '操作员ID',
    operator_name VARCHAR(100) NOT NULL COMMENT '操作员名称',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    KEY idx_consumable_device_id (device_id),
    KEY idx_consumable_operator_id (operator_id),
    KEY idx_consumable_created_at (created_at),
    KEY idx_consumable_type (consumable_type),
    CONSTRAINT consumable_records_device_id_fk FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    CONSTRAINT consumable_records_operator_id_fk FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT consumable_type_not_empty CHECK (CHAR_LENGTH(consumable_type) > 0),
    CONSTRAINT consumable_quantity_positive CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='耗材记录表';

-- ============================================
-- 9. 系统审计日志表
-- ============================================
-- 记录所有用户操作，用于安全审计

CREATE TABLE audit_logs (
    id CHAR(36) PRIMARY KEY COMMENT '日志ID (UUID)',
    user_id CHAR(36) COMMENT '用户ID',
    action VARCHAR(50) NOT NULL COMMENT '操作类型（create、update、delete、login等）',
    resource_type VARCHAR(50) NOT NULL COMMENT '资源类型（device、station、counter等）',
    resource_id CHAR(36) COMMENT '资源ID',
    details JSON DEFAULT '{}' COMMENT '操作详情',
    ip_address VARCHAR(45) COMMENT '操作IP',
    user_agent TEXT COMMENT '浏览器信息',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    
    KEY idx_audit_user_id (user_id),
    KEY idx_audit_resource_type (resource_type),
    KEY idx_audit_created_at (created_at),
    KEY idx_audit_action (action),
    CONSTRAINT audit_logs_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审计日志表';

-- ============================================
-- 10. 视图（统计汇总）
-- ============================================

-- 设备状态统计视图
CREATE VIEW device_status_summary AS
SELECT 
    st.id as station_id,
    st.name as station_name,
    st.type as station_type,
    d.status,
    COUNT(*) as count
FROM devices d
LEFT JOIN stations st ON d.station_id = st.id
WHERE d.is_active = true
GROUP BY st.id, st.name, st.type, d.status;

-- 柜台设备汇总视图
CREATE VIEW counter_devices_summary AS
SELECT 
    c.id as counter_id,
    c.name as counter_name,
    c.station_id,
    st.name as station_name,
    COUNT(d.id) as device_count,
    GROUP_CONCAT(d.name SEPARATOR ', ') as device_names
FROM counters c
LEFT JOIN stations st ON c.station_id = st.id
LEFT JOIN devices d ON c.id = d.counter_id AND d.is_active = true AND d.status = 'active'
WHERE c.is_active = true
GROUP BY c.id, c.name, c.station_id, st.name;

-- 设备类型统计视图
CREATE VIEW device_type_summary AS
SELECT 
    dt.id as type_id,
    dt.name as type_name,
    dt.category as category,
    COUNT(d.id) as total_count,
    SUM(CASE WHEN d.status = 'active' THEN 1 ELSE 0 END) as active_count,
    SUM(CASE WHEN d.status = 'standby' THEN 1 ELSE 0 END) as standby_count,
    SUM(CASE WHEN d.status = 'damaged' THEN 1 ELSE 0 END) as damaged_count,
    SUM(CASE WHEN d.status = 'repair' THEN 1 ELSE 0 END) as repair_count
FROM device_types dt
LEFT JOIN devices d ON dt.id = d.type_id AND d.is_active = true
WHERE dt.is_active = true
GROUP BY dt.id, dt.name, dt.category;

-- ============================================
-- 完成
-- ============================================

COMMIT;

-- ============================================
-- 脚本执行完成说明：
-- ============================================
-- 1. 此脚本创建了所有必要的表、索引、外键约束和视图
-- 2. 执行顺序：先运行此脚本，再运行 initial_data.sql
-- 3. 脚本使用 MySQL 特有的语法（ENGINE=InnoDB、GROUP_CONCAT）
-- 4. 所有外键约束都设置了合理的 ON DELETE 行为
-- 5. 索引已针对常用查询场景进行优化
-- 6. 包含 10 张表和 3 个统计视图
-- 7. 注意：MySQL 8.0+ 版本支持 CHECK 约束和 JSON 类型

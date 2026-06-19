-- ============================================
-- 机场设备管理系统 - PostgreSQL 数据库脚本
-- ============================================
-- 
-- 创建此脚本的命令：
-- psql -U airport_admin -d airport_equipment -f docs/schema_postgresql.sql
-- 
-- 版本：1.0.0
-- 创建日期：2026年6月
-- 
-- 目录结构：
-- 1. 扩展和类型定义
-- 2. 用户表
-- 3. 站点表
-- 4. 柜台表
-- 5. 设备类型表
-- 6. 设备表
-- 7. 设备更换记录表
-- 8. 换纸记录表
-- 9. 系统审计日志表
-- 10. 触发器（自动更新时间戳）
-- 11. 视图（统计汇总）

-- ============================================
-- 1. 扩展和类型定义
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户角色枚举
CREATE TYPE user_role AS ENUM ('admin', 'user');

-- 站点类型枚举
CREATE TYPE station_type AS ENUM ('checkin', 'gate', 'selfservice');

-- 设备状态枚举
CREATE TYPE device_status AS ENUM ('active', 'standby', 'damaged', 'repair');

-- ============================================
-- 2. 用户表
-- ============================================
-- 存储系统用户信息，支持管理员和普通用户两种角色

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码（bcrypt加密存储）',
    name VARCHAR(100) NOT NULL COMMENT '用户全名',
    role user_role NOT NULL DEFAULT 'user' COMMENT '用户角色',
    is_active BOOLEAN DEFAULT true COMMENT '是否激活',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
    
    CONSTRAINT username_length CHECK (LENGTH(username) >= 3),
    CONSTRAINT name_not_empty CHECK (LENGTH(name) > 0)
);

-- 索引：加速用户名查询和角色筛选
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ============================================
-- 3. 站点表
-- ============================================
-- 存储机场站点信息，包括值机岛、登机口、自助服务区

CREATE TABLE stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL COMMENT '站点名称',
    code VARCHAR(20) UNIQUE NOT NULL COMMENT '站点代码（如 A、B、GA）',
    type station_type NOT NULL COMMENT '站点类型',
    description TEXT COMMENT '站点描述',
    position_x INT DEFAULT 0 COMMENT 'X 坐标（用于可视化布局）',
    position_y INT DEFAULT 0 COMMENT 'Y 坐标（用于可视化布局）',
    is_active BOOLEAN DEFAULT true COMMENT '是否激活',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
    
    CONSTRAINT name_not_empty CHECK (LENGTH(name) > 0),
    CONSTRAINT code_not_empty CHECK (LENGTH(code) > 0)
);

-- 索引：加速站点代码查询和类型筛选
CREATE INDEX idx_stations_code ON stations(code);
CREATE INDEX idx_stations_type ON stations(type);
CREATE INDEX idx_stations_is_active ON stations(is_active);

-- ============================================
-- 4. 柜台表
-- ============================================
-- 存储站点下的柜台信息，支持值机岛和登机口柜台

CREATE TABLE counters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE COMMENT '所属站点',
    name VARCHAR(100) NOT NULL COMMENT '柜台名称',
    position INT NOT NULL COMMENT '位置序号（同一站点内唯一）',
    is_active BOOLEAN DEFAULT true COMMENT '是否激活',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
    
    CONSTRAINT name_not_empty CHECK (LENGTH(name) > 0),
    CONSTRAINT position_positive CHECK (position >= 0)
);

-- 索引：加速柜台查询和唯一性约束
CREATE INDEX idx_counters_station_id ON counters(station_id);
CREATE INDEX idx_counters_name ON counters(name);
CREATE UNIQUE INDEX idx_counters_unique_position ON counters(station_id, position);

-- ============================================
-- 5. 设备类型表
-- ============================================
-- 存储设备类型定义，支持自定义属性和图标

CREATE TABLE device_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL COMMENT '设备类型名称',
    category VARCHAR(50) NOT NULL COMMENT '分类（如 CUSS、值机电脑、打印机等）',
    description TEXT COMMENT '描述',
    icon TEXT COMMENT '图标（支持内置图标名或自定义图片base64）',
    attributes JSONB DEFAULT '{}' COMMENT '自定义属性 JSON',
    is_active BOOLEAN DEFAULT true COMMENT '是否激活',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
    
    CONSTRAINT name_not_empty CHECK (LENGTH(name) > 0),
    CONSTRAINT category_not_empty CHECK (LENGTH(category) > 0)
);

-- 索引：加速分类查询和激活状态筛选
CREATE INDEX idx_device_types_category ON device_types(category);
CREATE INDEX idx_device_types_is_active ON device_types(is_active);

-- ============================================
-- 6. 设备表
-- ============================================
-- 存储设备信息，支持备机（无站点）和在位设备

CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL COMMENT '设备名称',
    type_id UUID NOT NULL REFERENCES device_types(id) ON DELETE RESTRICT COMMENT '设备类型',
    serial_number VARCHAR(50) UNIQUE NOT NULL COMMENT '序列号',
    status device_status NOT NULL DEFAULT 'standby' COMMENT '设备状态',
    station_id UUID REFERENCES stations(id) ON DELETE SET NULL COMMENT '所属站点（备机设备为NULL）',
    counter_id UUID REFERENCES counters(id) ON DELETE SET NULL COMMENT '所属柜台（可选）',
    position INT DEFAULT 0 COMMENT '位置序号',
    custom_data JSONB DEFAULT '{}' COMMENT '自定义数据 JSON',
    notes TEXT COMMENT '备注',
    is_active BOOLEAN DEFAULT true COMMENT '是否激活',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
    
    CONSTRAINT name_not_empty CHECK (LENGTH(name) > 0),
    CONSTRAINT serial_number_not_empty CHECK (LENGTH(serial_number) > 0)
);

-- 索引：加速设备查询和状态筛选
CREATE INDEX idx_devices_serial_number ON devices(serial_number);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_devices_station_id ON devices(station_id);
CREATE INDEX idx_devices_counter_id ON devices(counter_id);
CREATE INDEX idx_devices_type_id ON devices(type_id);
CREATE INDEX idx_devices_is_active ON devices(is_active);

-- 复合索引：加速常用查询场景
CREATE INDEX idx_devices_status_station ON devices(status, station_id);
CREATE INDEX idx_devices_status_type ON devices(status, type_id);

-- ============================================
-- 7. 设备更换记录表
-- ============================================
-- 记录设备的移动和状态变更历史

CREATE TABLE device_change_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE COMMENT '设备ID',
    from_station_id UUID REFERENCES stations(id) ON DELETE SET NULL COMMENT '源站点',
    to_station_id UUID REFERENCES stations(id) ON DELETE SET NULL COMMENT '目标站点',
    from_counter_id UUID REFERENCES counters(id) ON DELETE SET NULL COMMENT '源柜台',
    to_counter_id UUID REFERENCES counters(id) ON DELETE SET NULL COMMENT '目标柜台',
    from_status device_status COMMENT '原状态（NULL表示新增设备）',
    to_status device_status COMMENT '新状态（NULL表示删除设备）',
    reason VARCHAR(255) NOT NULL COMMENT '变更原因',
    operator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT COMMENT '操作员ID',
    operator_name VARCHAR(100) NOT NULL COMMENT '操作员名称',
    notes TEXT COMMENT '备注',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '变更时间'
);

-- 索引：加速记录查询
CREATE INDEX idx_device_change_records_device_id ON device_change_records(device_id);
CREATE INDEX idx_device_change_records_operator_id ON device_change_records(operator_id);
CREATE INDEX idx_device_change_records_created_at ON device_change_records(created_at);

-- ============================================
-- 8. 换纸记录表（CUSS 自助机）
-- ============================================
-- 记录 CUSS 自助机的耗材更换情况

CREATE TABLE paper_change_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE COMMENT '设备ID',
    paper_type VARCHAR(50) NOT NULL COMMENT '纸张类型',
    quantity INT NOT NULL DEFAULT 1 COMMENT '数量',
    notes TEXT COMMENT '备注',
    operator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT COMMENT '操作员ID',
    operator_name VARCHAR(100) NOT NULL COMMENT '操作员名称',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    CONSTRAINT paper_type_not_empty CHECK (LENGTH(paper_type) > 0),
    CONSTRAINT quantity_positive CHECK (quantity > 0)
);

-- 索引：加速换纸记录查询
CREATE INDEX idx_paper_change_records_device_id ON paper_change_records(device_id);
CREATE INDEX idx_paper_change_records_operator_id ON paper_change_records(operator_id);
CREATE INDEX idx_paper_change_records_created_at ON paper_change_records(created_at);

-- ============================================
-- 9. 系统审计日志表
-- ============================================
-- 记录所有用户操作，用于安全审计

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL COMMENT '用户ID',
    action VARCHAR(50) NOT NULL COMMENT '操作类型（create、update、delete、login等）',
    resource_type VARCHAR(50) NOT NULL COMMENT '资源类型（device、station、counter等）',
    resource_id UUID COMMENT '资源ID',
    details JSONB DEFAULT '{}' COMMENT '操作详情',
    ip_address VARCHAR(45) COMMENT '操作IP',
    user_agent TEXT COMMENT '浏览器信息',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间'
);

-- 索引：加速审计日志查询
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- ============================================
-- 10. 触发器：自动更新 updated_at
-- ============================================
-- 当记录更新时自动更新 updated_at 字段

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_update_timestamp BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER stations_update_timestamp BEFORE UPDATE ON stations
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER counters_update_timestamp BEFORE UPDATE ON counters
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER device_types_update_timestamp BEFORE UPDATE ON device_types
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER devices_update_timestamp BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================
-- 11. 视图（统计汇总）
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
    STRING_AGG(d.name, ', ') as device_names
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
-- 1. 此脚本创建了所有必要的表、索引、触发器和视图
-- 2. 执行顺序：先运行此脚本，再运行 initial_data.sql
-- 3. 脚本使用 PostgreSQL 特有的语法（ENUM、JSONB、UUID 扩展）
-- 4. 所有外键约束都设置了合理的 ON DELETE 行为
-- 5. 索引已针对常用查询场景进行优化

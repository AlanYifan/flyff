/**
 * @file database.go
 * @description SQLite数据库初始化和表结构定义
 * @description 创建users、player_saves、dungeon_progress、enhance_attributes等表
 * @description 预创建GM默认账号（recall），普通玩家通过注册页面自行创建账号
 */
package main

import (
	"database/sql"
	"fmt"
	"log"
	"strings"

	_ "modernc.org/sqlite"
)

/**
 * @function InitDB
 * @description 初始化SQLite数据库连接，创建必要的数据表
 * @param {string} dbPath - 数据库文件路径
 * @returns {*sql.DB} 数据库连接实例
 * @returns {error} 初始化错误
 */
func InitDB(dbPath string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", dbPath+"?_journal_mode=WAL&_busy_timeout=5000")
	if err != nil {
		return nil, fmt.Errorf("打开数据库失败: %w", err)
	}

	// 设置连接池参数
	db.SetMaxOpenConns(1) // SQLite单写者模式
	db.SetMaxIdleConns(1)

	// 启用外键约束
	if _, err := db.Exec("PRAGMA foreign_keys = ON"); err != nil {
		return nil, fmt.Errorf("启用外键约束失败: %w", err)
	}

	// 创建数据表
	if err := createTables(db); err != nil {
		return nil, fmt.Errorf("创建数据表失败: %w", err)
	}

	return db, nil
}

/**
 * @function createTables
 * @description 创建所有必要的数据表，如果表已存在则跳过
 * @param {*sql.DB} db - 数据库连接实例
 * @returns {error} 创建错误
 */
func createTables(db *sql.DB) error {
	// 用户表 - 存储账号信息（is_gm 标记GM权限账号）
	createUsersTable := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT NOT NULL UNIQUE,
		password TEXT NOT NULL,
		email TEXT DEFAULT '',
		is_gm INTEGER NOT NULL DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		last_login_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`

	// 玩家存档表 - 存储每个存档槽的角色数据（JSON格式）
	createPlayerSavesTable := `
	CREATE TABLE IF NOT EXISTS player_saves (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		slot_index INTEGER NOT NULL,
		nickname TEXT DEFAULT '',
		class TEXT DEFAULT 'beginner',
		level INTEGER DEFAULT 1,
		data TEXT NOT NULL DEFAULT '{}',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		last_login_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
		UNIQUE(user_id, slot_index)
	);`

	// 副本进度表 - 存储副本进度数据
	createDungeonProgressTable := `
	CREATE TABLE IF NOT EXISTS dungeon_progress (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		slot_index INTEGER NOT NULL,
		data TEXT NOT NULL DEFAULT '{}',
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
		UNIQUE(user_id, slot_index)
	);`

	// 属性强化数据表 - 存储属性强化数据
	createEnhanceAttributesTable := `
	CREATE TABLE IF NOT EXISTS enhance_attributes (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		slot_index INTEGER NOT NULL,
		data TEXT NOT NULL DEFAULT '{}',
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
		UNIQUE(user_id, slot_index)
	);`

	// 用户设置表 - 存储用户设置数据
	createUserSettingsTable := `
	CREATE TABLE IF NOT EXISTS user_settings (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		slot_index INTEGER NOT NULL,
		data TEXT NOT NULL DEFAULT '{}',
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
		UNIQUE(user_id, slot_index)
	);`

	// API更新记录表 - 存储FlyFF API数据更新的历史记录（仅记录有数据变化的更新）
	createApiUpdateLogsTable := `
	CREATE TABLE IF NOT EXISTS api_update_logs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		local_version TEXT NOT NULL DEFAULT '',
		remote_version TEXT NOT NULL DEFAULT '',
		item_new INTEGER NOT NULL DEFAULT 0,
		item_failed INTEGER NOT NULL DEFAULT 0,
		monster_new INTEGER NOT NULL DEFAULT 0,
		monster_failed INTEGER NOT NULL DEFAULT 0,
		skill_new INTEGER NOT NULL DEFAULT 0,
		skill_failed INTEGER NOT NULL DEFAULT 0,
		equipset_new INTEGER NOT NULL DEFAULT 0,
		equipset_failed INTEGER NOT NULL DEFAULT 0,
		achievement_new INTEGER NOT NULL DEFAULT 0,
		achievement_failed INTEGER NOT NULL DEFAULT 0,
		image_downloaded INTEGER NOT NULL DEFAULT 0,
		image_failed INTEGER NOT NULL DEFAULT 0,
		name_cns_updated INTEGER NOT NULL DEFAULT 0,
		desc_cns_updated INTEGER NOT NULL DEFAULT 0,
		total_new INTEGER NOT NULL DEFAULT 0,
		total_failed INTEGER NOT NULL DEFAULT 0,
		message TEXT NOT NULL DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`

	tables := []string{
		createUsersTable,
		createPlayerSavesTable,
		createDungeonProgressTable,
		createEnhanceAttributesTable,
		createUserSettingsTable,
		createApiUpdateLogsTable,
	}

	for _, table := range tables {
		if _, err := db.Exec(table); err != nil {
			return fmt.Errorf("执行建表SQL失败: %w", err)
		}
	}

	// 数据库迁移：为旧版 api_update_logs 表新增 equipset 和 achievement 字段
	migrations := []string{
		`ALTER TABLE api_update_logs ADD COLUMN equipset_new INTEGER NOT NULL DEFAULT 0`,
		`ALTER TABLE api_update_logs ADD COLUMN equipset_failed INTEGER NOT NULL DEFAULT 0`,
		`ALTER TABLE api_update_logs ADD COLUMN achievement_new INTEGER NOT NULL DEFAULT 0`,
		`ALTER TABLE api_update_logs ADD COLUMN achievement_failed INTEGER NOT NULL DEFAULT 0`,
		// 为旧版 users 表新增 is_gm 字段（GM权限标记）
		`ALTER TABLE users ADD COLUMN is_gm INTEGER NOT NULL DEFAULT 0`,
	}
	for _, m := range migrations {
		/* 忽略"列已存在"错误（SQLite 报 duplicate column name） */
		if _, err := db.Exec(m); err != nil {
			if !strings.Contains(err.Error(), "duplicate column name") {
				log.Printf("[DB] 迁移执行失败: %v", err)
			}
		}
	}

	// 创建索引
	indexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_player_saves_user_id ON player_saves(user_id)",
		"CREATE INDEX IF NOT EXISTS idx_dungeon_progress_user_id ON dungeon_progress(user_id)",
		"CREATE INDEX IF NOT EXISTS idx_enhance_attributes_user_id ON enhance_attributes(user_id)",
		"CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id)",
	}

	for _, index := range indexes {
		if _, err := db.Exec(index); err != nil {
			return fmt.Errorf("创建索引失败: %w", err)
		}
	}

	return nil
}



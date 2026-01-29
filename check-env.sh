#!/bin/bash
# 检查Railway环境变量的脚本

echo "=== 检查Railway环境变量 ==="
echo "NODE_ENV: $NODE_ENV"
echo ""
echo "=== 检查数据库环境变量 ==="
echo "DATABASE_URL 存在: $(if [ -n "$DATABASE_URL" ]; then echo "是"; else echo "否"; fi)"
echo "DATABASE_PUBLIC_URL 存在: $(if [ -n "$DATABASE_PUBLIC_URL" ]; then echo "是"; else echo "否"; fi)"
echo "PGHOST 存在: $(if [ -n "$PGHOST" ]; then echo "是"; else echo "否"; fi)"
echo "PGPORT 存在: $(if [ -n "$PGPORT" ]; then echo "是"; else echo "否"; fi)"
echo "PGDATABASE 存在: $(if [ -n "$PGDATABASE" ]; then echo "是"; else echo "否"; fi)"
echo "PGUSER 存在: $(if [ -n "$PGUSER" ]; then echo "是"; else echo "否"; fi)"
echo "PGPASSWORD 存在: $(if [ -n "$PGPASSWORD" ]; then echo "是"; else echo "否"; fi)"
echo ""
echo "=== 数据库URL格式检查 ==="
if [[ -n "$DATABASE_URL" ]]; then
    echo "DATABASE_URL 格式: $(echo $DATABASE_URL | grep -o '^[^:]*://')"
    if [[ $DATABASE_URL == *"postgresq1"* ]]; then
        echo "⚠️  警告: DATABASE_URL 包含格式错误 (postgresq1)，应为 postgresql"
    else
        echo "✅ DATABASE_URL 格式正确"
    fi
else
    echo "❌ DATABASE_URL 未设置"
fi

if [[ -n "$DATABASE_PUBLIC_URL" ]]; then
    echo "DATABASE_PUBLIC_URL 格式: $(echo $DATABASE_PUBLIC_URL | grep -o '^[^:]*://')"
    if [[ $DATABASE_PUBLIC_URL == *"postgresq1"* ]]; then
        echo "⚠️  警告: DATABASE_PUBLIC_URL 包含格式错误 (postgresq1)，应为 postgresql"
    else
        echo "✅ DATABASE_PUBLIC_URL 格式正确"
    fi
else
    echo "❌ DATABASE_PUBLIC_URL 未设置"
fi
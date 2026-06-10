// Windows 防火墙自动配置模块
// 在服务启动时自动检查和添加防火墙入站规则

const { execSync } = require('child_process');

const RULE_NAME = 'NetData Server';
const PORT = process.env.PORT || 52587;

/**
 * 检查并自动配置 Windows 防火墙规则
 * 非 Windows 系统直接返回 true
 */
function ensureFirewallRule() {
    if (process.platform !== 'win32') {
        return true; // macOS/Linux 无需处理
    }

    try {
        // 检查规则是否已存在
        const checkCmd = `netsh advfirewall firewall show rule name="${RULE_NAME}"`;
        execSync(checkCmd, { stdio: 'pipe' });
        console.log(`🔒 防火墙规则已存在: ${RULE_NAME} (端口 ${PORT})`);
        return true;
    } catch {
        // 规则不存在，尝试添加
        try {
            const addCmd = `netsh advfirewall firewall add rule name="${RULE_NAME}" dir=in action=allow protocol=TCP localport=${PORT}`;
            execSync(addCmd, { stdio: 'pipe' });
            console.log(`✅ 已自动添加防火墙规则: ${RULE_NAME} (端口 ${PORT})`);
            console.log(`   💡 如需删除: netsh advfirewall firewall delete rule name="${RULE_NAME}"`);
            return true;
        } catch (err) {
            console.warn(`⚠️  无法自动配置防火墙规则 (可能需要管理员权限):`);
            console.warn(`   请手动运行: netsh advfirewall firewall add rule name="${RULE_NAME}" dir=in action=allow protocol=TCP localport=${PORT}`);
            console.warn(`   或临时关闭防火墙后重试。`);
            return false;
        }
    }
}

module.exports = { ensureFirewallRule };

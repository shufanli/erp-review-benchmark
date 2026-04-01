# 配置 A — 裸 Claude Code（无额外 review 工具）

## Review 规则

代码全部写完后：
1. 运行 `/review` 命令
2. 逐条查看 review 结果
3. 修复所有发现的问题
4. 再次运行 `/review` 确认修复


## 指标采集

整个开发过程中，每次发生以下事件，追加一行 JSON 到项目根目录的 `metrics.jsonl`：

### 阶段标记
开始和结束每个大阶段时：
```json
{"event":"phase","ts":"2026-04-01T10:00:00Z","agent":"single","name":"review|test|fix","action":"start|end"}
```

### Bug 发现
当 /review 发现问题，或你自己发现 bug 时：
```json
{"event":"bug_found","ts":"2026-04-01T10:00:00Z","source":"claude_review|self","description":"一句话描述","severity":"P0|P1|P2","file":"涉及文件","fixed":true}
```

### 测试编写
每写一个测试用例时：
```json
{"event":"test_written","ts":"2026-04-01T10:00:00Z","file":"测试文件路径","type":"positive|negative","description":"测什么"}
```
- positive = 测正常流程能走通
- negative = 测异常/边界/错误路径（空输入、未授权、超时、并发等）

### 代码覆盖率
所有测试写完后，运行覆盖率检查并记录结果：
```json
{"event":"coverage","ts":"2026-04-01T10:00:00Z","lines":85.2,"branches":72.1,"functions":90.0,"statements":84.5}
```

### 完成标记
全部工作完成时：
```json
{"event":"done","ts":"2026-04-01T10:00:00Z","total_commits":N}
```

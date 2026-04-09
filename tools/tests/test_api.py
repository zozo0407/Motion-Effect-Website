import os
import time
from pathlib import Path
from dotenv import load_dotenv
from openai import (
    APIConnectionError,
    APIStatusError,
    AuthenticationError,
    BadRequestError,
    NotFoundError,
    OpenAI,
    RateLimitError,
)

dotenv_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=dotenv_path)

api_key = os.getenv("AI_API_KEY")
base_url = os.getenv("AI_BASE_URL")
model = os.getenv("AI_MODEL")

# 先检查变量是否加载成功
print("🔑 API Key: 已加载" if api_key else "❌ API Key 为空！请检查 .env 文件")
print(f"🔗 Base URL: {base_url}" if base_url else "❌ Base URL 为空！请检查 .env 文件")
print(f"🤖 Model: {model}" if model else "❌ Model 为空！请检查 .env 文件")

if not api_key or not base_url or not model:
    print("\n⚠️  请确认 .env 文件在当前目录下，且格式为：")
    print("   AI_API_KEY=sk-xxxxxxxx")
    print("   AI_BASE_URL=https://api.moonshot.cn/v1")
    print("   AI_MODEL=kimi-k2.5")
    exit(1)

client = OpenAI(
    api_key=api_key,
    base_url=base_url,
)

print("\n🚀 正在测试 API...")

try:
    def _env_int(name: str, default: int) -> int:
        value = os.getenv(name)
        if value is None or value.strip() == "":
            return default
        try:
            return int(value)
        except ValueError:
            return default

    def _env_float(name: str, default: float) -> float:
        value = os.getenv(name)
        if value is None or value.strip() == "":
            return default
        try:
            return float(value)
        except ValueError:
            return default

    max_retries = _env_int("AI_MAX_RETRIES", 3)
    initial_backoff = _env_float("AI_INITIAL_BACKOFF_SECONDS", 0.5)
    backoff_multiplier = _env_float("AI_BACKOFF_MULTIPLIER", 2.0)
    max_backoff = _env_float("AI_MAX_BACKOFF_SECONDS", 4.0)
    retryable_status_codes = {502, 503, 504, 522, 524, 525, 554}

    def _error_payload(e: Exception) -> tuple:
        body = getattr(e, "body", None)
        if isinstance(body, dict):
            err = body.get("error")
            if isinstance(err, dict):
                return err.get("type"), err.get("message"), err.get("code")
        return None, None, None

    def _is_retryable_error(e: Exception) -> bool:
        err_type, err_message, _ = _error_payload(e)
        if isinstance(e, BadRequestError) and err_type == "upstream_error":
            return True
        if isinstance(e, AuthenticationError) and err_type in {"new_api_error", "upstream_error"}:
            return True
        if isinstance(e, APIConnectionError):
            return True
        if isinstance(e, APIStatusError):
            status_code = getattr(e, "status_code", None)
            return status_code in retryable_status_codes
        if isinstance(err_message, str) and "数据库查询出错" in err_message:
            return True
        return False

    max_attempts = 1 + max(0, max_retries)
    for attempt in range(1, max_attempts + 1):
        try:
            completion = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "user", "content": "你好，请用一句话介绍自己"}
                ],
            )
            print(f"\n✅ 成功！回复：{completion.choices[0].message.content}")
            break
        except (APIConnectionError, APIStatusError, BadRequestError, AuthenticationError) as e:
            should_retry = _is_retryable_error(e)
            if (not should_retry) or attempt >= max_attempts:
                raise
            wait_seconds = min(max_backoff, initial_backoff * (backoff_multiplier ** (attempt - 1)))
            status_code = getattr(e, "status_code", None)
            err_type, err_message, _ = _error_payload(e)
            parts = []
            if status_code is not None:
                parts.append(f"HTTP {status_code}")
            if err_type:
                parts.append(f"type={err_type}")
            if isinstance(err_message, str) and err_message.strip() != "":
                parts.append(f"message={err_message.strip()}")
            detail = ("，".join(parts)) if parts else e.__class__.__name__
            print(f"\n⚠️  可重试错误（{detail}），将在 {wait_seconds:.2f}s 后重试（{attempt}/{max_attempts}）")
            time.sleep(wait_seconds)
except AuthenticationError as e:
    body = getattr(e, "body", None)
    err = body.get("error") if isinstance(body, dict) else None
    err_type = err.get("type") if isinstance(err, dict) else None
    err_message = err.get("message") if isinstance(err, dict) else None
    if err_type in {"new_api_error", "upstream_error"} or (isinstance(err_message, str) and "数据库查询出错" in err_message):
        print("\n❌ 失败：401（上游/平台内部错误导致的鉴权失败，可稍后重试）")
        print(f"   详情：{e}")
    else:
        print("\n❌ 失败：401 Invalid Authentication（API Key 无效或已失效）")
        print(f"   详情：{e}")
except RateLimitError as e:
    print("\n❌ 失败：429 Rate Limit（触发限流/额度不足）")
    print(f"   详情：{e}")
except BadRequestError as e:
    body = getattr(e, "body", None)
    err = body.get("error") if isinstance(body, dict) else None
    err_type = err.get("type") if isinstance(err, dict) else None
    if err_type == "upstream_error":
        print("\n❌ 失败：400（上游/转发错误，可能是平台临时异常，可稍后重试）")
        print(f"   详情：{e}")
    else:
        print("\n❌ 失败：400 Bad Request（请求参数有问题，比如 model 不存在）")
        print(f"   详情：{e}")
except NotFoundError as e:
    print("\n❌ 失败：404 Not Found（base_url 或接口路径不对）")
    print(f"   详情：{e}")
except APIConnectionError as e:
    print("\n❌ 失败：网络连接错误（超时/DNS/代理）")
    print(f"   详情：{e}")
except APIStatusError as e:
    print(f"\n❌ 失败：HTTP {e.status_code}")
    print(f"   详情：{e}")
except Exception as e:
    print("\n❌ 失败：未知错误")
    print(f"   详情：{e}")

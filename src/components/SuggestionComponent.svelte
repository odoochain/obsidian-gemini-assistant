<script lang="ts">
import { onMount } from 'svelte'
import type GeminiService from 'GeminiService'
import type { Prompt } from 'Settings'
import GeminiIcon from './GeminiIcon.svelte'

export let option: Prompt
export let gemini: GeminiService

// 初始化变量
let prompt = option.prompt;
let tokenCount;

// 在组件挂载时检查输入并获取token计数
onMount(async () => {
    if (!option || !gemini || !prompt) {
        console.error('Invalid input provided to GeminiOption component.');
        return;
    }
    try {
        tokenCount = await gemini.countToken(prompt);
    } catch (error) {
        console.error('Failed to fetch token count:', error);
        tokenCount = null; // 设置为null以便在模板中区分成功和失败状态
    }
});
</script>

<div class="gemini-option">
    <span>
        <span>
            <GeminiIcon class="gemini-icon" />
        </span>
        {option.display}
    </span>
    {#if tokenCount === null}
        <span class="loading-indicator"></span>
    {:else}
        <span
            class={tokenCount > option.config.inputTokenLimit
                ? 'token-exceed'
                : 'token-normal'}
        >
            {tokenCount}
        </span>
    {/if}
</div>

<style>
.gemini-option {
    display: flex;
    justify-content: space-between;
}

.gemini-icon {
    width: 12px;
    height: 12px;
}

.token-normal {
    font-size: 0.6rem;
    color: var(--text-muted);
    align-self: flex-end;
}

.token-exceed {
    font-size: 0.6rem;
    color: var(--text-error);
    align-self: flex-end;
}

.loading-indicator {
    /* 添加适合您项目的加载指示器样式 */
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: var(--loading-color);
    animation: spin 1s linear infinite; /* 添加动画效果 */
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>

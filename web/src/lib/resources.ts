export interface ResourceLink {
    title: string;
    description: string;
    url: string;
    category: string;
}

export const resourceCategories = {
    model: "模型与论文",
    tools: "开发工具",
    docs: "文档与教程",
    community: "社区资源",
} as const;

export const resourceCategoriesEn = {
    model: "Model & Papers",
    tools: "Dev Tools",
    docs: "Docs & Tutorials",
    community: "Community",
} as const;

export type ResourceCategory = keyof typeof resourceCategories;

// 配置资源链接
export const resources: ResourceLink[] = [
    // 模型与论文
    {
        title: "Z-Image-Turbo Model",
        description: "Hugging Face 模型仓库",
        url: "https://huggingface.co/Tongyi-MAI/Z-Image-Turbo",
        category: "model",
    },
    {
        title: "Z-Image Project",
        description: "Z-Image 官方项目主页",
        url: "https://github.com/tongyi-mai/z-image",
        category: "model",
    },
    {
        title: "Diffusers Library",
        description: "Hugging Face Diffusers 库",
        url: "https://github.com/huggingface/diffusers",
        category: "model",
    },

    // 开发工具
    {
        title: "Ollama",
        description: "本地运行大语言模型",
        url: "https://ollama.com",
        category: "tools",
    },
    {
        title: "Next.js",
        description: "React 应用框架",
        url: "https://nextjs.org",
        category: "tools",
    },
    {
        title: "FastAPI",
        description: "Python Web 框架",
        url: "https://fastapi.tiangolo.com",
        category: "tools",
    },

    // 文档与教程
    {
        title: "PyTorch MPS Backend",
        description: "Apple Silicon GPU 加速文档",
        url: "https://pytorch.org/docs/stable/notes/mps.html",
        category: "docs",
    },
    {
        title: "Framer Motion",
        description: "React 动画库文档",
        url: "https://www.framer.com/motion/",
        category: "docs",
    },
    {
        title: "Tailwind CSS",
        description: "实用优先的 CSS 框架",
        url: "https://tailwindcss.com",
        category: "docs",
    },

    // 社区资源
    {
        title: "Z-Image macOS",
        description: "本项目 GitHub 仓库",
        url: "https://github.com/leochanai/z-image-mac",
        category: "community",
    },
    {
        title: "Hugging Face Hub",
        description: "AI 模型社区平台",
        url: "https://huggingface.co",
        category: "community",
    },
];

// 按分类组织资源
export function getResourcesByCategory(locale: "zh" | "en" = "zh"): Record<string, ResourceLink[]> {
    const categories = locale === "zh" ? resourceCategories : resourceCategoriesEn;
    const result: Record<string, ResourceLink[]> = {};

    Object.keys(categories).forEach((category) => {
        result[category] = resources.filter((r) => r.category === category);
    });

    return result;
}

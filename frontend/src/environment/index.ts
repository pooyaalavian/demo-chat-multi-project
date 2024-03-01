declare global {
    interface ImportMeta {
        env: Record<string, unknown>;
    }
}
const MODE = import.meta.env.VITE_MODE as ('development' | 'production');

interface Environment {
    production: boolean;
    api: string;
}

const environment_dev: Environment = {
    production: false,
    api: 'http://localhost:5000/api',
};

const environment_prod: Environment = {
    production: true,
    api: '/api',
};

export const environment = MODE === 'production' ? environment_prod : environment_dev;

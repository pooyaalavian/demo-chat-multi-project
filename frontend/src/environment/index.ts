// declare global {
//     interface ImportMeta {
//         env: Record<string, unknown>;
//     }
// }
const MODE = import.meta.env.MODE as ('development' | 'production');

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

console.log({env: import.meta.env});

export const environment = MODE === 'production' ? environment_prod : environment_dev;

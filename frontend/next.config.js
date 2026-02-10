/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${process.env.BACKEND_URL || 'http://backend:8000'}/api/:path*`,
            },
            {
                source: '/search/:path*',
                destination: `${process.env.BACKEND_URL || 'http://backend:8000'}/search/:path*`,
            },
            {
                source: '/cite/:path*',
                destination: `${process.env.BACKEND_URL || 'http://backend:8000'}/cite/:path*`,
            },
        ]
    },
}

module.exports = nextConfig

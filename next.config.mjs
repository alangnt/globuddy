/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.public.blob.vercel-storage.com'
            }
        ],
        domains: [
            "localhost",
            "127.0.0.1",
            "globuddy.com",
            "globuddy.com.br",
            "www.globuddy.com",
            "www.globuddy.com.br",
            "globuddy.vercel.app",
            "www.globuddy.vercel.app",
            "globuddy.vercel.app",
            "www.globuddy.vercel.app",
        ]
    }
};

export default nextConfig;

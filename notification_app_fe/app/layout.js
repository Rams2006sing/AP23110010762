export const metadata = {
    title: 'Campus Notifications',
    description: 'Campus Notifications Microservice - Priority Notification Dashboard',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body style={{ margin: 0, padding: 0 }}>
                {children}
            </body>
        </html>
    );
}

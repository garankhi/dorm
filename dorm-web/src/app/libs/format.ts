export function formatDate(value: string) {
    return new Intl.DateTimeFormat("vi-VN").format(new Date(value));
}
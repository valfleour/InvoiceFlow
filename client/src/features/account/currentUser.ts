export interface WorkspaceUser {
    name: string;
    email: string;
    role: string;
}

export const currentUser: WorkspaceUser = {
    name: 'Avery Stone',
    email: 'avery.stone@invoiceflow.app',
    role: 'Workspace Owner',
};

export function getUserInitials(name: string) {
    const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');

    return initials || 'IF';
}

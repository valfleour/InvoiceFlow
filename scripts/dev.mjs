import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const npmCommand = process.platform === 'win32' ? 'npm run dev' : 'npm run dev';
const rootDir = process.cwd();

const processes = [
    startProcess('server', path.join(rootDir, 'server')),
    startProcess('client', path.join(rootDir, 'client')),
];

let isShuttingDown = false;

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

for (const child of processes) {
    child.process.on('exit', (code, signal) => {
        if (isShuttingDown) {
            return;
        }

        const exitCode = code ?? 0;

        if (signal) {
            console.error(`[${child.name}] stopped by signal ${signal}`);
            shutdown(1);
            return;
        }

        if (exitCode !== 0) {
            console.error(`[${child.name}] exited with code ${exitCode}`);
            shutdown(exitCode);
            return;
        }

        console.log(`[${child.name}] exited`);
        shutdown(0);
    });
}

function startProcess(name, cwd) {
    const child = spawn(npmCommand, {
        cwd,
        env: process.env,
        shell: true,
        stdio: ['inherit', 'pipe', 'pipe'],
    });

    relayOutput(child.stdout, process.stdout, name);
    relayOutput(child.stderr, process.stderr, name);

    return { name, process: child };
}

function relayOutput(stream, target, name) {
    let buffer = '';

    stream.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? '';

        for (const line of lines) {
            target.write(`[${name}] ${line}\n`);
        }
    });

    stream.on('end', () => {
        if (buffer) {
            target.write(`[${name}] ${buffer}\n`);
        }
    });
}

function shutdown(exitCode) {
    if (isShuttingDown) {
        return;
    }

    isShuttingDown = true;

    for (const child of processes) {
        if (!child.process.killed) {
            child.process.kill('SIGINT');
        }
    }

    setTimeout(() => process.exit(exitCode), 250);
}

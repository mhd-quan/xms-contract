import type { shell } from 'electron'

export interface ShellService {
  openPath(path: string): Promise<void>
  showItemInFolder(path: string): void
}

export class ElectronShellService implements ShellService {
  constructor(private readonly electronShell: Pick<typeof shell, 'openPath' | 'showItemInFolder'>) {}

  async openPath(path: string): Promise<void> {
    await this.electronShell.openPath(path)
  }

  showItemInFolder(path: string): void {
    this.electronShell.showItemInFolder(path)
  }
}

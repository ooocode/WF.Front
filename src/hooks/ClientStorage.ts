
export class ClientStorage/*  implements Storage  */ {
    //[name: string]: any;
    length: number = 0;
    clear(): void {
        console.log('clear:')
    }
    //async getItem(key: string): Promise<string> {
    //  console.log('getItem:' + key)

    //return await localForage.getItem(key) ?? ''
    // }
    key(index: number): string {
        alert('key' + index)
        console.log('key:' + index)
        return index.toString()
    }
    removeItem(key: string): void {
        //localForage.removeItem(key)
        console.log('removeItem:' + key)
    }
    setItem(key: string, value: string): void {
        console.log('setItem:' + key)
        console.log('setItem:' + value)
        //localForage.setItem(key, value)
    }
}

export class ClientStorageEmpty {
    //[name: string]: any;
    length: number = 0;
    clear(): void {
        console.log('clear:')
    }
    getItem(key: string): string {
        console.log('getItem:' + key)
        return ""
    }
    key(index: number): string {
        console.log('key:' + index)
        return ""
    }
    removeItem(key: string): void {
        console.log('removeItem:' + key)
    }
    setItem(key: string, value: string): void {
        console.log('setItem:' + key)
        console.log('setItem:' + value)
    }
}
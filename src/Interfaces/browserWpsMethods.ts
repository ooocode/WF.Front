const wpsUrl = 'http://127.0.0.1:58890'

export async function wpsIsRunning(){
    try {
        var res = await fetch(wpsUrl+'/isRunning',{
            method:'post',
           
        })
        console.log(res)
    } catch (error) {
        
    }
    
}
import SwitchDark from './components/Switch';
import Footer from './components/Footer';

import React, { useEffect, useState, useRef } from 'react';
import axios, { AxiosRequestConfig, CancelTokenSource, AxiosError } from 'axios';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faStop, faCopy, faEye, faEyeSlash, faSpinner  } from '@fortawesome/free-solid-svg-icons';

import { FlagIcon } from 'react-flag-kit';
import copyToClipboard from 'copy-to-clipboard';

export default function App() {

  const proxyTypes = [ 'socks4', 'socks5', 'http', 'https' ];
  const [ proxyType, setProxyType ] = useState('socks4');
  const handleProxyTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const proxyType = event.target.value;
    setProxyType(proxyType);
  };

  const [ timeoutProxy, setTimeoutProxy ] = useState(1000);
  const handleTimeoutProxyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const proxyTimeout = event.target.value;
    setTimeoutProxy(+proxyTimeout);
  };

  const [ threads, setThreads ] = useState(10);
  const handleThreadsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const threads = event.target.value;
    setThreads(+threads);
  };

  const [ proxies, setProxies ] = useState({
    value: '',
    filtered: 0,
  });
  const handleProxiesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProxies({
      ...proxies,
      value: event.target.value,
    });
  };

  const [ copyMessage, setCopyMessage ] = useState({ deads: '', alives: '' });
  const [ showAlives, setShowALives ] = useState(false);
  const [ alives, setAlives ] = useState<any[]>([ ]);
  const alivesRef = useRef<HTMLParagraphElement | null>(null);
  
  const [ showDeads, setShowDeads ] = useState(false);
  const [ deads, setDeads ] = useState<any[]>([ ]);
  const deadsRef = useRef<HTMLParagraphElement | null>(null);
  
  let cancelToken = useRef<CancelTokenSource | undefined>();
  
  type TcontrolChecker = 'initial' | 'started' | 'stoped' | 'finalized';
  const [ controlChecker, setControlChecker ] = useState<TcontrolChecker>('initial');
  const [ statusChecker, setStatusChecker ] = useState({
    verified: 0,
    total: 0,
    status: 'Comand waiting...',
  });

  const filterProxies = (text: string) => {
    const ipv4WithPortPattern = /(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(:|\s)+(\d+)/g;
    const matches = text.match(ipv4WithPortPattern);
    return matches? [ ...new Set(matches) ]
                          .map(value => value.replace(/\s+/, ':'))
                          .join('\n').trim()
                  : '';
  };

  const handleStart = () => {
    const filteredProxies = filterProxies(proxies.value);
    setProxies(prev => ({
        ...prev,
        value: filteredProxies,
        filtered: filteredProxies? ++proxies.filtered: 0,
    }));
    if(!filteredProxies) {
      setControlChecker('initial');
      setStatusChecker(prev => ({
        ...prev,
        status: 'Empty proxy list',
      }));
      return;
    };
    setControlChecker('started');
    console.log('checker started');
  };

  const copy = (copy: 'alives' | 'deads') => () => {
    const ref = copy === 'alives'? alivesRef.current?.innerHTML: deadsRef.current?.innerHTML;
    const listProxies = ref?.match(/<div[^>]*>(.*?)<\/div>/g);
    const listProxiesClipboard = listProxies
              ?.map(proxy => 
                proxy.replace(/<\/?[^>]+(>|$)/g, '')
                      .replace(/\s+/g, ' ')
                      .trim()
              )
              .join('\n')
              .trim() || '';
    const copySuccess = copyToClipboard(listProxiesClipboard);
    if(copySuccess) {
      setCopyMessage(prev => ({ ...prev, ...(copy === 'alives'? { alives: 'copied' }: { deads: 'copied' }) }));
    } else {
      setCopyMessage(prev => ({ ...prev, ...(copy === 'alives'? { alives: 'not copied' }: { deads: 'not copied' }) }));
    }
    setTimeout(() => setCopyMessage(({ alives: '', deads: '' })), 500);
  }

  const handleStop = () => {
    cancelToken.current!.cancel('Checker stoped');
    setControlChecker('stoped');
    console.log('checker stoped');
  };

  const removeProxy = (proxyToRemove: string) => {
    setProxies(prev => {
      const proxyList = prev.value.split(/\t|\n/);
      const newProxyList = proxyList.filter(proxy => proxyToRemove !== proxy);
      prev = {
        ...prev,
        value: newProxyList.join('\n').trim(),
      };
      return prev;
    });
  };

  const handleChecker = () => {
    const proxyList = proxies.value.split(/\t|\n/).filter(Boolean);
    const totalProxyList = proxyList.length;
    let counterProxyList = 0;
    cancelToken.current = axios.CancelToken.source();

    //set status
    setStatusChecker(prev => ({
      ...prev,
      status: 'verifying',
      verified: counterProxyList,
      total: totalProxyList,
    }));

    const recursion = () => {
      const baseURL = import.meta.env.VITE_BACKEND_PROXY_CHECKER_API;
      let threadsCompleted = 0;
      proxyList.splice(0, threads).forEach(proxy => {
        const config: AxiosRequestConfig = {
          method: 'POST',
          url: baseURL,
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          },
          cancelToken: cancelToken.current!.token,
          // timeout: timeoutProxy,
          data: JSON.stringify({
            url: 'https://ipv4.icanhazip.com/',
            proxy,
            proxyType,
            timeout: timeoutProxy,
          }),
        };
        axios(config)
        .then(res => {
          const data = res.data;
          if(data.success) {
            setAlives(prev => [ ...prev, data ]);
          } else {
            setDeads(prev => [ ...prev, data ]);
          }
          removeProxy(proxy);
          counterProxyList++;
        })
        .catch(err => {
          if (!axios.isCancel(err)) {
            const data = {
              success: false,
              message: err.message,
              proxy,
            };
            setDeads(prev => [ ...prev, data ]);
            removeProxy(proxy);
            counterProxyList++;
          }
        })
        .finally(() => {
          threadsCompleted++;
          setStatusChecker(prev => ({
            ...prev,
            verified: counterProxyList,
          }));

          if(counterProxyList === totalProxyList) {
            if(controlChecker === 'started') {
              setControlChecker('finalized');
            }
            return;
          }
          if(threads === threadsCompleted) {
            threadsCompleted = 0;
            recursion();
          };
        });

      })
    };
    recursion();
    
  };

  // const strToCapitalize = (string: string) => string.charAt(0).toUpperCase() + string.slice(1);;

  useEffect(() => {
    document.body.classList.add('dark:bg-slate-900');
  }, [ ]);

  useEffect(() => {
    if(proxies.filtered && controlChecker === 'started') {
      handleChecker();
    }
  }, [ proxies.filtered ]);

  useEffect(() => {
    if(!['stoped', 'finalized'].includes(controlChecker)) return;
    setStatusChecker(prev => ({
      ...prev,
      status: controlChecker,
    }));
  }, [ controlChecker ]);

  return (
    <div className="mt-8 mx-20 max-lg:mx-2 dark:text-slate-400">
      {/* title */}
      <div className="flex justify-center relative my-8 w-full">
        <h1 className="text-3xl font-bold dark:text-slate-200 capitalize">proxy checker</h1>
        <SwitchDark className="absolute right-0 border-white border-2"/>
      </div>

      {/* main */}
      <div className="border-2 rounded border-black dark:border-white p-8 grid grid-cols-3 max-lg:grid-cols-1 gap-x-5 gap-y-10">
        {/* options */}
        <div className="flex flex-col justify-between gap-y-4">
          {/* type */}
          <h2 className="uppercase font-bold dark:text-slate-200">options</h2>
          <div className="flex">
            <label htmlFor="proxyType" className="capitalize cursor-pointer w-[30%] border-2 rounded-l border-black dark:border-white dark:text-slate-200 px-2 hover:text-sky-500 dark:hover:text-sky-400">type</label>
            <div className="w-[70%] border-2 border-l-0 rounded-r border-black dark:border-white
            form-focus-container
            ">
              <select name="proxyType" id="proxyType" className="w-full bg-transparent px-2 capitalize focus:[outline:0] focus-visible:[outline:0] disabled:cursor-not-allowed" onChange={ handleProxyTypeChange } value={ proxyType } disabled={controlChecker === 'started'}>
                { proxyTypes.map(proxyType => (<option className="dark:bg-slate-900" value={ proxyType } key={ proxyType }>{ proxyType }</option>)) }
              </select>
            </div>
          </div>
          {/* timeout */}
          <div className="flex">
            <label htmlFor="timeoutProxy" className="capitalize cursor-pointer w-[30%] border-2 rounded-l border-black dark:border-white dark:text-slate-200 hover:text-sky-500 dark:hover:text-sky-400 px-2">timeout</label>
              <div className="flex w-[70%] border-2 border-l-0 rounded-r border-black dark:border-white px-2 form-focus-container">
                <input type="range" name="timeoutProxy" id="timeoutProxy" className="w-[75%] focus:[outline:0] focus-visible:[outline:0] disabled:cursor-not-allowed"
                disabled={controlChecker === 'started'}
                onChange={ handleTimeoutProxyChange }
                value={ timeoutProxy }
                min={ 100 }
                max={ 5000 }
                step={ 100 }
                />
                <span className="w-[25%] text-right">{ timeoutProxy }ms</span>
              </div>
          </div>
          {/* proxy */}
          <div className="flex">
            <label htmlFor="threadsProxy" className="capitalize cursor-pointer w-[30%] border-2 rounded-l border-black dark:border-white dark:text-slate-200 hover:text-sky-500 dark:hover:text-sky-400 px-2">threads</label>
              <div className="flex w-[70%] border-2 border-l-0 rounded-r border-black dark:border-white px-2 form-focus-container">
                <input type="range" name="threadsProxy" id="threadsProxy" className="w-[75%] focus:[outline:0] focus-visible:[outline:0] disabled:cursor-not-allowed"
                disabled={controlChecker === 'started'}
                onChange={ handleThreadsChange }
                value={ threads }
                min={ 1 }
                max={ 30 }
                step={ 1 }
                />
                <span className="w-[25%] text-right">{ threads }</span>
              </div>
          </div>
        </div>
        
        {/* listProxies */}
        <div className="flex flex-col justify-between gap-y-4">
          <h2 className="uppercase font-bold dark:text-slate-200">proxies</h2>
          <div className="border-2 border-black dark:border-white rounded w-full h-full form-focus-container max-lg:h-40" >
            <textarea className="bg-transparent text-center resize-none w-full h-full focus:[outline:0] focus-visible:[outline:0] disabled:cursor-not-allowed" placeholder="127.0.0.1:80" onChange={ handleProxiesChange } value={ proxies.value } disabled={controlChecker === 'started'} ></textarea>
          </div>
        </div>
        
        {/* controls */}
        <div className="flex flex-col justify-between gap-y-4">
          <h2 className="uppercase font-bold dark:text-slate-200">controls</h2>
          <button className="border-2 border-black dark:border-white rounded capitalize btn-focus hover:bg-blue-900 bg-blue-700 text-slate-200 disabled:bg-blue-900 disabled:cursor-not-allowed" disabled={ !['initial', 'stoped', 'finalized'].includes(controlChecker) } onClick={ handleStart }>start <FontAwesomeIcon icon={faPlay}/></button>
          <button className="border-2 border-black dark:border-white rounded capitalize btn-focus hover:bg-blue-900 bg-blue-700 text-slate-200 disabled:bg-blue-900 disabled:cursor-not-allowed" disabled={ !['started'].includes(controlChecker) }onClick={ handleStop }>stop <FontAwesomeIcon icon={faStop}/></button>
          <span className="text-center dark:text-slate-200 capitalize">
            {controlChecker === 'started' && <span><FontAwesomeIcon icon={faSpinner} spin /> </span>}
            { `${statusChecker.status}${['started', 'stoped', 'finalized'].includes(controlChecker)? ` ${statusChecker.verified}/${statusChecker.total}`: ''}` }</span>
        </div>
      </div>

      {/* alives */}
      <div className="border-2 rounded border-black dark:border-white p-2 mt-10">
        <div className="flex justify-between">
          <div className="inline-flex gap-x-1">
            <span className="capitalize font-semibold dark:text-slate-200">alives</span>
            <span className="font-semibold bg-green-500 text-white px-2 rounded">{ alives.length }</span>
          </div>
          <div className="inline-flex gap-x-2">
            <button className="border-2 border-black dark:border-white rounded cursor-pointer px-2 btn-focus dark:text-slate-200 hover:bg-blue-900 bg-blue-700 text-slate-200"
            onClick={ () => setShowALives(!showAlives) }>
              <FontAwesomeIcon icon={ showAlives? faEye: faEyeSlash }/>
              </button>
              <button className="border-2 border-black dark:border-white rounded cursor-pointer px-2 btn-focus dark:text-slate-200 hover:bg-blue-900 bg-blue-700 text-slate-200 disabled:bg-blue-900 disabled:cursor-not-allowed" onClick={copy('alives')}><FontAwesomeIcon icon={faCopy}/> { copyMessage.alives }</button>
          </div>
        </div>
        <div className={`mt-2 ${!showAlives && 'hidden'}`} ref={ alivesRef }>
          {
            alives.map((value, index) => (
              <div className='mb-2' key={index}>
                <span className="font-semibold bg-blue-600 text-white px-2 rounded capitalize">socks4</span>
                <span className="font-bold"> { value.proxy } | { value.timeout }ms </span>
                <span className="font-semibold bg-violet-500 text-white px-2 rounded capitalize">locatión</span>
                <FlagIcon code={ value.ipLookup.country.iso_code } className='ml-2 inline' size={25} />
                <span className="font-bold"> { value.ipLookup.country.names.en } | { value.ipLookup.location.time_zone }</span>
              </div>
            ))
          }
        </div>
      </div>

      {/* deads */}
      <div className="border-2 rounded border-black dark:border-white p-2 mt-10 mb-10">
        <div className="flex justify-between">
          <div className="inline-flex gap-x-1">
            <span className="capitalize font-semibold dark:text-slate-200">deads</span>
            <span className="font-semibold bg-red-500 text-white px-2 rounded">{ deads.length }</span>
          </div>
          <div className="inline-flex gap-x-2">
            <button className="border-2 border-black dark:border-white rounded cursor-pointer px-2 btn-focus dark:text-slate-200 hover:bg-blue-900 bg-blue-700 text-slate-200"
            onClick={ () => setShowDeads(!showDeads) }>
              <FontAwesomeIcon icon={ showDeads? faEye: faEyeSlash}/>
            </button>
            <button className="border-2 border-black dark:border-white rounded cursor-pointer px-2 btn-focus dark:text-slate-200 hover:bg-blue-900 bg-blue-700 text-slate-200 disabled:bg-blue-900 disabled:cursor-not-allowed" onClick={ copy('deads') }><FontAwesomeIcon icon={faCopy}/> { copyMessage.deads }</button>
          </div>
        </div>
        <div className={`mt-2 ${ !showDeads && 'hidden' }`} ref={ deadsRef }>
          {
            deads.map((value, key) => (
              <div className='mb-2' key={key}>
                <span className="font-semibold bg-red-600 text-white px-2 rounded capitalize">socks4</span>
                <span className="font-bold"> { value.proxy } | { value.timeout }ms </span>
              </div>
            ))
          }
        </div>
      </div>

      {/* footer */}
      <Footer/>
    </div>
  );
}
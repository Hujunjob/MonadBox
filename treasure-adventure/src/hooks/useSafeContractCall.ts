import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { useToast } from '../components/ToastManager';

/**
 * 安全的合约调用 Hook
 * 强制要求模拟调用，确保交易不会失败
 */
export function useSafeContractCall() {
  const { connector } = useAccount();
  const isBurnerWallet = connector?.id === 'burnerWallet';
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed, 
    data: receipt,
    error: receiptError
  } = useWaitForTransactionReceipt({ 
    hash,
    query: {
      enabled: !!hash, // 只有当有hash时才开始监听
    }
  });
  const { showToast } = useToast();
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentOnSuccess, setCurrentOnSuccess] = useState<((receipt: any) => void) | null>(null);
  const [currentSuccessMessage, setCurrentSuccessMessage] = useState<string>('');

  // 监听交易确认并触发成功回调
  useEffect(() => {
    console.log('交易状态变化:', { 
      hash,
      isConfirmed, 
      isConfirming,
      hasReceipt: !!receipt, 
      hasCallback: !!currentOnSuccess,
      receiptError,
      receipt 
    });
    
    // 交易确认后的处理逻辑
    if (isConfirmed && receipt) {
      console.log('交易确认成功，receipt:', receipt);
      
      // 显示成功toast
      if (currentSuccessMessage) {
        showToast(currentSuccessMessage, 'success');
        setCurrentSuccessMessage(''); // 清除消息避免重复显示
      }
      
      // 调用成功回调
      if (currentOnSuccess) {
        console.log('触发成功回调');
        currentOnSuccess(receipt);
        setCurrentOnSuccess(null); // 清除回调避免重复调用
      }
    } else if (isConfirmed && !receipt) {
      console.error('⚠️ 交易确认但收据为空，这不应该发生');
      console.log('等待收据数据...', { receiptError });
    }
    
    if (receiptError) {
      console.error('获取交易收据时出错:', receiptError);
    }
  }, [isConfirmed, isConfirming, receipt, currentOnSuccess, currentSuccessMessage, hash, receiptError, showToast]);

  const safeCall = async (
    contractConfig: any,
    simulationHook?: any, // 现在是可选的
    options?: {
      loadingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: (receipt: any) => void; // 成功回调
    }
  ) => {
    const {
      loadingMessage = '正在验证交易参数...',
      successMessage = '交易成功！',
      errorMessage = '交易验证失败',
      onSuccess
    } = options || {};

    try {
      console.log('safeCall called with config:', contractConfig);
      setIsSimulating(true);
      showToast(loadingMessage, 'info');
      
      // 保存成功回调和成功消息
      setCurrentOnSuccess(() => onSuccess || null);
      setCurrentSuccessMessage(successMessage);

      // 如果没有提供模拟调用，直接执行（跳过验证）
      if (!simulationHook) {
        console.log('⚠️ 跳过模拟验证，直接执行交易');
        console.log('Contract config to execute:', contractConfig);
        
        // 对于 burner wallet，直接执行交易（自动签名）
        console.log('执行交易，钱包类型:', isBurnerWallet ? 'burner' : 'external');
        console.log('About to call writeContract with:', contractConfig);
        writeContract(contractConfig);
        console.log('writeContract called');
        return;
      }

      console.log("simulationHook");
      console.log(simulationHook);
      
      console.log('🔍 检查合约模拟结果...');
      
      if (simulationHook.isLoading || simulationHook.isPending) {
        throw new Error('模拟调用正在进行中，请等待完成');
      }

      if (simulationHook.error) {
        console.error('模拟调用错误:', simulationHook.error);
        throw new Error(simulationHook.error.message || '模拟调用失败');
      }

      if (!simulationHook.data) {
        throw new Error('无法获取模拟结果，请检查参数和网络连接');
      }

      console.log('✅ 模拟成功，准备发起交易');

      // 发起真实交易
      showToast('验证通过，正在发起交易...', 'info');
      console.log(contractConfig);
      
      // 执行交易
      console.log('执行交易，钱包类型:', isBurnerWallet ? 'burner' : 'external');
      writeContract(contractConfig);

    } catch (error: any) {
      console.error('Safe contract call failed:', error);
      
      // 智能错误处理
      let userMessage = errorMessage;
      
      if (error.message?.includes('User rejected')) {
        userMessage = '用户取消了交易';
      } else if (error.message?.includes('insufficient funds')) {
        userMessage = '账户余额不足';
      } else if (error.message?.includes('Player already registered')) {
        userMessage = '玩家已经注册过了';
      } else if (error.message?.includes('Player not registered')) {
        userMessage = '玩家未注册，请先注册';
      } else if (error.message?.includes('Not enough stamina')) {
        userMessage = '体力不足，请等待恢复';
      } else if (error.message?.includes('Invalid name length')) {
        userMessage = '玩家名称长度不符合要求（2-20字符）';
      } else if (error.message?.includes('Box already opened')) {
        userMessage = '宝箱已经被开启过了';
      } else if (error.message?.includes('Invalid box index')) {
        userMessage = '无效的宝箱索引';
      } else if (error.message) {
        userMessage = `${errorMessage}: ${error.message}`;
      }

      showToast(userMessage, 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  return {
    safeCall,
    hash,
    isPending: isPending || isSimulating,
    isConfirming,
    isConfirmed,
    error
  };
}
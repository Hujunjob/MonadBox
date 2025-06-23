import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useToast } from '../components/ToastManager';

/**
 * 安全的合约调用 Hook
 * 强制要求模拟调用，确保交易不会失败
 */
export function useSafeContractCall() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({ hash });
  const { showToast } = useToast();
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentOnSuccess, setCurrentOnSuccess] = useState<((receipt: any) => void) | null>(null);

  // 监听交易确认并触发成功回调
  useEffect(() => {
    if (isConfirmed && receipt && currentOnSuccess) {
      console.log('交易确认成功，触发成功回调');
      currentOnSuccess(receipt);
      setCurrentOnSuccess(null); // 清除回调避免重复调用
    }
  }, [isConfirmed, receipt, currentOnSuccess]);

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
      errorMessage = '交易验证失败',
      onSuccess
    } = options || {};

    try {
      setIsSimulating(true);
      showToast(loadingMessage, 'info');
      
      // 保存成功回调
      setCurrentOnSuccess(onSuccess || null);

      // 如果没有提供模拟调用，直接执行（跳过验证）
      if (!simulationHook) {
        console.log('⚠️ 跳过模拟验证，直接执行交易');
        showToast('正在发起交易...', 'info');
        writeContract(contractConfig);
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
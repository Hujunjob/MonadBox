import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useToast } from '../components/ToastManager';

/**
 * 安全的合约调用 Hook
 * 在调用前进行各种检查和用户友好的错误处理
 */
export function useSafeContractCall() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const { showToast } = useToast();
  const [isSimulating, setIsSimulating] = useState(false);

  const safeCall = async (
    contractConfig: any,
    simulationHook?: any,
    options?: {
      loadingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
    }
  ) => {
    const {
      loadingMessage = '正在验证交易参数...',
      successMessage = '交易发起成功！',
      errorMessage = '交易验证失败'
    } = options || {};

    try {
      setIsSimulating(true);
      showToast(loadingMessage, 'info');

      // 如果提供了模拟钩子，先检查模拟结果
      if (simulationHook) {
        console.log('🔍 检查合约模拟结果...');
        
        if (simulationHook.error) {
          throw new Error(simulationHook.error.message || '模拟调用失败');
        }

        if (!simulationHook.data) {
          throw new Error('无法获取模拟结果，请检查参数');
        }

        console.log('✅ 模拟成功，准备发起交易');
      } else {
        console.log('⚠️ 跳过模拟验证，直接发起交易');
      }

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
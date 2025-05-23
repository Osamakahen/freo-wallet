'use client'

import React, { useEffect, useState } from 'react';
import { useTransactions } from '../contexts/TransactionContext';
import { TransactionReceipt } from '../types/wallet';
import { ChainConfig } from '../core/chain/ChainAdapter';
import { Table, Input, Select, DatePicker, Space, Typography, Tag, Modal } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { formatEther } from 'viem';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface TransactionHistoryProps {
  address: string;
  network: ChainConfig;
}

interface ExtendedTransactionReceipt extends TransactionReceipt {
  amount: bigint;
  hash: string;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ address, network }) => {
  const { transactionHistory, loading, error, refreshHistory } = useTransactions();
  const [selectedTx, setSelectedTx] = useState<ExtendedTransactionReceipt | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [blockTimestamps, setBlockTimestamps] = useState<Record<string, number>>({});

  useEffect(() => {
    refreshHistory();
  }, [address, network, refreshHistory]);

  const getBlockTimestamp = async (blockNumber: bigint) => {
    if (blockTimestamps[blockNumber.toString()]) {
      return blockTimestamps[blockNumber.toString()];
    }
    try {
      const response = await fetch(`${network.rpcUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBlockByNumber',
          params: [`0x${blockNumber.toString(16)}`, false],
          id: 1,
        }),
      });
      const data = await response.json();
      const timestamp = parseInt(data.result.timestamp, 16);
      setBlockTimestamps(prev => ({
        ...prev,
        [blockNumber.toString()]: timestamp
      }));
      return timestamp;
    } catch (error) {
      console.error('Error fetching block timestamp:', error);
      return 0;
    }
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'send' ? 'red' : 'green'}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: bigint) => `${formatEther(amount)} ETH`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'success' ? 'success' : 'error'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'blockNumber',
      key: 'blockNumber',
      render: async (blockNumber: bigint) => {
        const timestamp = await getBlockTimestamp(blockNumber);
        return dayjs(timestamp * 1000).format('YYYY-MM-DD HH:mm:ss');
      },
    },
    {
      title: 'Hash',
      dataIndex: 'hash',
      key: 'hash',
      render: (hash: string) => (
        <Typography.Link onClick={() => setSelectedTx(transactionHistory.find(tx => tx.hash === hash) as ExtendedTransactionReceipt)}>
          {`${hash.slice(0, 6)}...${hash.slice(-4)}`}
        </Typography.Link>
      ),
    },
  ];

  const filteredTransactions = transactionHistory
    .filter((tx) => {
      const matchesSearch = tx.hash.toLowerCase().includes(searchText.toLowerCase());
      const matchesStatus = !statusFilter || tx.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => Number(b.blockNumber - a.blockNumber));

  if (loading) {
    return <div className="p-4">Loading transactions...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  if (!transactionHistory.length) {
    return <div className="p-4">No transactions found</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Search by hash"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-64"
        />
        <Select
          placeholder="Filter by status"
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
          className="w-32"
        >
          <Select.Option value="success">Success</Select.Option>
          <Select.Option value="failed">Failed</Select.Option>
        </Select>
        <RangePicker
          value={dateRange}
          onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
          className="w-64"
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredTransactions}
        rowKey="hash"
        pagination={{ pageSize: 10 }}
      />

      {selectedTx && (
        <Modal
          title="Transaction Details"
          open={!!selectedTx}
          onCancel={() => setSelectedTx(null)}
          footer={null}
        >
          <Space direction="vertical" size="large">
            <div>
              <Typography.Text strong>Hash:</Typography.Text>
              <Typography.Text copyable>{selectedTx.hash}</Typography.Text>
            </div>
            <div>
              <Typography.Text strong>From:</Typography.Text>
              <Typography.Text copyable>{selectedTx.from}</Typography.Text>
            </div>
            <div>
              <Typography.Text strong>To:</Typography.Text>
              <Typography.Text copyable>{selectedTx.to}</Typography.Text>
            </div>
            <div>
              <Typography.Text strong>Amount:</Typography.Text>
              <Typography.Text>{formatEther(selectedTx.amount)} ETH</Typography.Text>
            </div>
            <div>
              <Typography.Text strong>Status:</Typography.Text>
              <Tag color={selectedTx.status === 'success' ? 'success' : 'error'}>
                {selectedTx.status.toUpperCase()}
              </Tag>
            </div>
            <div>
              <Typography.Text strong>Date:</Typography.Text>
              <Typography.Text>
                {dayjs(Number(selectedTx.blockNumber) * 1000).format('YYYY-MM-DD HH:mm:ss')}
              </Typography.Text>
            </div>
          </Space>
        </Modal>
      )}
    </div>
  );
};

export default TransactionHistory; 
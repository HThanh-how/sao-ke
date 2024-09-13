"use client";
import { useState, useEffect } from "react";

interface Transaction {
  date: string;
  amount: string; // The amount is still stored as a string in the JSON file.
  details: string;
  transaction_code: string;
}

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Transaction;
    direction: string;
  } | null>(null);
  const [isHydrated, setIsHydrated] = useState(false); // Check if component is hydrated

  useEffect(() => {
    // Mark the component as hydrated on the client side
    setIsHydrated(true);
    setItemsPerPage(10);
    // Fetch data from local JSON file
    fetch("/data/transactions.json")
      .then((response) => response.json())
      .then((data) => setTransactions(data.transactions));
  }, []);

  // Normalize function to remove diacritics
  const normalizeString = (str: string) =>
    str
      .normalize('NFD') // Split characters and accents
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .toLowerCase(); // Convert to lowercase

  // Prevent rendering before hydration
  if (!isHydrated) {
    return null; // Return nothing until the component is hydrated
  }

  const handleSort = (key: keyof Transaction) => {
    let direction = "ascending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const parseAmount = (amountStr: string): number => {
    // Remove any commas or periods used for formatting
    const cleanedAmount = amountStr.replace(/[,.]/g, "");
    return parseFloat(cleanedAmount) || 0;
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    if (sortConfig !== null) {
      if (sortConfig.key === "amount") {
        const amountA = parseAmount(a.amount);
        const amountB = parseAmount(b.amount);
        return sortConfig.direction === "ascending" ? amountA - amountB : amountB - amountA;
      } else {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
      }
    }
    return 0;
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Automatically go to page 1 if search term length is more than 3 characters
    if (value.length >= 3) {
      setCurrentPage(1);
    }
  };

  const filteredTransactions = sortedTransactions.filter((transaction) => {
    if (searchTerm.length < 3) {
      return true; // If less than 3 characters, show all transactions
    }
    return Object.values(transaction).some((value) =>
      normalizeString(value).includes(normalizeString(searchTerm))
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const maxPageDisplay = 5;
  const startPage = Math.max(1, currentPage - Math.floor(maxPageDisplay / 2));
  const endPage = Math.min(totalPages, startPage + maxPageDisplay - 1);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6 text-white">Bảng Giao Dịch</h1>

      <div className="mb-6 mx-4 w-full max-w-xl sm:max-w-3xl">
        <input
          type="text"
          placeholder="Nhập nội dung chuyển khoản, số tiền, mã giao dịch..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full px-4 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
        />
        <p className="text-sm text-gray-400 mt-2">
          (Nhập ít nhất 3 ký tự để tìm kiếm)
        </p>
      </div>

      {/* Updated: Table now takes 95% width on mobile and 90% on larger screens */}
      <div className="overflow-x-auto w-[95%] sm:w-[90%]">
        <table className="table-auto w-full bg-gray-800 shadow-lg rounded-lg">
          <thead className="bg-gray-700 text-gray-300">
            <tr>
              <th
                className="px-4 py-2 cursor-pointer hover:bg-gray-600"
                onClick={() => handleSort("date")}
              >
                Ngày & Mã GD
              </th>
              <th
                className="px-4 py-2 cursor-pointer hover:bg-gray-600"
                onClick={() => handleSort("amount")}
              >
                Số tiền
              </th>
              <th
                className="px-4 py-2 cursor-pointer hover:bg-gray-600"
                onClick={() => handleSort("details")}
              >
                Nội dung
              </th>
            </tr>
          </thead>
          <tbody>
            {currentTransactions.map((transaction, index) => (
              <tr key={index} className="border-b border-gray-700 hover:bg-gray-700">
                <td className="px-4 py-2 text-center text-gray-300">
                  {transaction.date} <br /> {transaction.transaction_code}
                </td>
                <td className="px-4 py-2 text-center text-gray-300">{transaction.amount}</td>
                <td className="px-4 py-2 text-center text-gray-300">{transaction.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center w-[95%] sm:w-[90%] mt-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2">
          {currentPage > 1 && (
            <button
              onClick={() => paginate(1)}
              className="px-3 py-1 border border-gray-600 bg-gray-800 text-white hover:bg-gray-700 rounded-md"
            >
              First
            </button>
          )}

          {Array.from({ length: endPage - startPage + 1 }, (_, index) => (
            <button
              key={index}
              onClick={() => paginate(startPage + index)}
              className={`px-3 py-1 border border-gray-600 rounded-md ${
                currentPage === startPage + index ? "bg-gray-600 text-white" : "bg-gray-800 text-white"
              } hover:bg-gray-700`}
            >
              {startPage + index}
            </button>
          ))}

          {currentPage < totalPages && (
            <button
              onClick={() => paginate(totalPages)}
              className="px-3 py-1 border border-gray-600 bg-gray-800 text-white hover:bg-gray-700 rounded-md"
            >
              Last
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;

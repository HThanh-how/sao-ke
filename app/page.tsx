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
  const [goToPage, setGoToPage] = useState<number | "">("");
  const [isHydrated, setIsHydrated] = useState(false); // Check if component is hydrated

  useEffect(() => {
    // Mark the component as hydrated on the client side
    setIsHydrated(true);

    // Fetch data from local JSON file
    fetch("/data/transactions.json")
      .then((response) => response.json())
      .then((data) => setTransactions(data.transactions));
  }, []);

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

  const filteredTransactions = sortedTransactions.filter((transaction) => {
    if (searchTerm.length < 3) {
      return true; // If less than 3 characters, show all transactions
    }
    return Object.values(transaction).some((value) =>
      value.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleGoToPage = () => {
    if (typeof goToPage === "number" && goToPage >= 1 && goToPage <= totalPages) {
      setCurrentPage(goToPage);
      setGoToPage(""); // Reset input field
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6 text-white">Bảng Giao Dịch</h1>

      <div className="mb-6 w-full max-w-md">
        <input
          type="text"
          placeholder="Tìm kiếm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
        />
        <p className="text-sm text-gray-400 mt-2">
          (Nhập ít nhất 3 ký tự để tìm kiếm)
        </p>
      </div>

      {/* Updated: Fixed table width with 90% for large screens */}
      <div className="overflow-x-auto w-[90%] lg:w-[90%] sm:w-full">
        <table className="table-auto w-full bg-gray-800 shadow-lg rounded-lg">
          <thead className="bg-gray-700 text-gray-300">
            <tr>
              <th
                className="px-4 py-2 cursor-pointer hover:bg-gray-600"
                onClick={() => handleSort("date")}
              >
                Ngày GD
              </th>
              <th
                className="px-4 py-2 cursor-pointer hover:bg-gray-600"
                onClick={() => handleSort("amount")}
              >
                Số tiền ghi nợ
              </th>
              <th
                className="px-4 py-2 cursor-pointer hover:bg-gray-600"
                onClick={() => handleSort("details")}
              >
                Số tiền ghi có
              </th>
              <th
                className="px-4 py-2 cursor-pointer hover:bg-gray-600"
                onClick={() => handleSort("transaction_code")}
              >
                Mã số GD
              </th>
            </tr>
          </thead>
          <tbody>
            {currentTransactions.map((transaction, index) => (
              <tr key={index} className="border-b border-gray-700 hover:bg-gray-700">
                <td className="px-4 py-2 text-center text-gray-300">{transaction.date}</td>
                <td className="px-4 py-2 text-center text-gray-300">{transaction.amount}</td>
                <td className="px-4 py-2 text-center text-gray-300">{transaction.details}</td>
                <td className="px-4 py-2 text-center text-gray-300">{transaction.transaction_code}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center w-[90%] lg:w-[90%] sm:w-full mt-6">
        <div className="flex items-center">
          <span className="mr-2 text-gray-300">Số dòng mỗi trang:</span>
          <input
            type="number"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="px-2 py-1 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            min={1}
          />
        </div>

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
                currentPage === startPage + index
                  ? "bg-gray-600 text-white"
                  : "bg-gray-800 text-white"
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

        <div className="flex items-center justify-center ml-4">
          <input
            type="number"
            placeholder="Đi đến trang..."
            value={goToPage}
            onChange={(e) => setGoToPage(Number(e.target.value))}
            className="px-4 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white mr-2"
            min={1}
            max={totalPages}
          />
          <button
            onClick={handleGoToPage}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-500"
          >
            Đi
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;

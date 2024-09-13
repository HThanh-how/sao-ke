"use client";
import { useState, useEffect } from "react";
import _ from "lodash"; // Import lodash for debounce

interface Transaction {
  date: string;
  amount: string; // The amount is still stored as a string in the JSON file.
  details: string;
  transaction_code: string;
}

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]); // Lưu trữ dữ liệu hiện tại
  const [newTransactions, setNewTransactions] = useState<Transaction[]>([]); // Lưu trữ dữ liệu mới khi tải
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Transaction;
    direction: string;
  } | null>(null);
  const [isHydrated, setIsHydrated] = useState(false); // Kiểm tra nếu component đã hydrat hóa
  const [isLoading, setIsLoading] = useState(false); // Trạng thái tải dữ liệu
  
  useEffect(() => {
    // Đánh dấu component đã hydrat hóa
    setIsHydrated(true);
    fetchData(""); // Tải dữ liệu ban đầu
  }, []);

  const fetchData = async (search: string) => {
    setIsLoading(true); // Hiển thị trạng thái đang tải

    try {
      const response = await fetch("/data/transactions.json"); // Thay đổi thành API thật
      const data = await response.json();

      // Lọc dữ liệu phía client chỉ để thử nghiệm (nên làm phía server trong thực tế)
      const filteredData = data.transactions.filter((transaction: Transaction) => {
        return Object.values(transaction).some((value) =>
          normalizeString(value).includes(normalizeString(search))
        );
      });

      // Lưu dữ liệu mới khi tải xong
      setNewTransactions(filteredData);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false); // Ngừng hiển thị trạng thái tải
    }
  };

  const normalizeString = (str: string) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  // Handle search input with debounce
  const handleSearch = _.debounce((value: string) => {
    setSearchTerm(value);
    fetchData(value); // Tải dữ liệu mới khi người dùng tìm kiếm
    setCurrentPage(1); // Reset lại trang về 1
  }, 500); // 500ms debounce

  const handleSort = (key: keyof Transaction) => {
    let direction = "ascending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const parseAmount = (amountStr: string): number => {
    const cleanedAmount = amountStr.replace(/[,.]/g, "");
    return parseFloat(cleanedAmount) || 0;
  };

  // Sắp xếp dữ liệu hiện tại
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

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = sortedTransactions.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const maxPageDisplay = 5;
  const startPage = Math.max(1, currentPage - Math.floor(maxPageDisplay / 2));
  const endPage = Math.min(totalPages, startPage + maxPageDisplay - 1);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Luôn chạy hook `useEffect`, nhưng chỉ cập nhật dữ liệu khi cần
  useEffect(() => {
    if (!isLoading && newTransactions.length > 0) {
      setTransactions(newTransactions);
    }
  }, [isLoading, newTransactions]);

  // Khi component chưa hydrat hóa, trả về null để tránh lỗi
  if (!isHydrated) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6 text-white">Bảng Giao Dịch</h1>

      <div className="mb-6 mx-4 w-full max-w-xl sm:max-w-3xl relative">
        <input
          type="text"
          placeholder="Nhập nội dung chuyển khoản, số tiền, mã giao dịch..."
          onChange={(e) => handleSearch(e.target.value)}
          className={`w-full px-4 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white ${
            isLoading ? "loading" : ""
          }`}
        />
        {isLoading && (
          <div className="absolute top-2 right-4 animate-spin text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              ></path>
            </svg>
          </div>
        )}
        <p className="text-sm text-gray-400 mt-2">(Nhập ít nhất 3 ký tự để tìm kiếm)</p>
      </div>

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

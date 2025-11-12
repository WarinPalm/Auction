// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

abstract contract Auction {
    // ข้อมูลสินค้า (ชื่อ / หมายเลขกำกับ)
    struct ProductInfo { // สร้างฟิลด์
        string Brand; // ชื่อแบรนด์
        string SerialNumber; // หมายเลขกำกับ
    }
    // กำหนดสถานะการประมูล (started), สิ้นสุด (ended), ถูกยกเลิก (cancelled) | ค่าที่ได้จาก enum คือ started = 0 , ended = 1 , cancelled = 2
    enum AuctionState { STARTED, ENDED, CANCELLED } // เมื่อมี {} จะไม่มี ; จะปิด | อะไรก็ตามที่ไม่ใช่ {} ให้จบด้วย ; เสมอ 

    // เรียกดูข้อมูลสินค้า
    // สร้างข้อกำหนด (requirement) 
    function getProductInfo()  virtual public view returns (string memory , string memory) ;

    // ยื่นประมูล
    // virtual เพราะยังไม่ impliment (ใช้งานจริง) | func ที่มีการรับเงินต้องมี payable **ไม่เกี่ยวกับจ่ายเงิน** 
    function bid() virtual external payable;

    // ประมูลไปเท่าไหร่
    function getMyBid(address bidder) virtual external view returns (uint256);

    // สิ้นสุดการประมูล | ต้องมีการจ่ายเงินด้วย
    function endAuction() virtual external; 

    // ยกเลิกการประมูล
    function cancelAuction() virtual external;
    // ยอดประมูลสูงสุดเท่าไหร่
    // function getHighestBid() virtual view external returns(uint256); 
    
    // สำหรับถอนเงิน
    function withdraw() virtual external;  

    // event ที่เกิดขึ้นเมื่อมีการประมูล 
    event BidEvent(address bidder, uint256 amount, uint256 timestamp); // ประมูลเกิดขึ้นแล้ว
    event EndedEvent(string message , uint256 timestamp); // ประมูลสิ้นสุดแล้ว
    event CancelledEvent(string message, uint256 timestamp); // ประมูลถูกยกเลิกแล้ว
    event WithdrawnEvent(address withdrawer, uint256 amount, uint256 timestamp); // เงินถูกถอนแล้ว

}